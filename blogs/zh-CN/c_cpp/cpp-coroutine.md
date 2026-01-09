# 手把手学习 C++20 协程（coroutine）

> Copyright (C) 2026 Timothy Liu
>
> [Creative Commons — 署名-相同方式共享 4.0 国际 — CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans) 许可证

## 前言

C++20 标准引入了协程的支持。C++20 协程的设计并不像其他语言那么简单，各种规定和概念较为繁杂。而网络上的相关教程大多首先开始各种概念的罗列，对学习者十分不友好。本教程讲使用需求驱动（编译器驱动）的方法，直接从代码入手，在实践中手把手地学习 C++20 的协程。

## 什么是协程？

什么是协程？协程能做什么？对还没有接触过相关概念的读者可能比较陌生。学术地说，协程允许程序在线程内部进行上下文切换——但这不够直观。我们以两个例子来说明协程的作用。

### 序列生成

我们如果要得到一个序列，例如得到一个自然数 0 \~ 9 的序列，在 C++ 我们可以返回一个包含这个序列的数组：

```c++
std::vector<int> iota(int n) {
    std::vector<int> seq;
    for (int i = 0; i < n; ++i) {
        seq.emplace_back(i);
    }
    return seq;
}
```

但很多时候我们并不希望这样做。最简单的，这样做需要额外的存储空间来存储这个序列。如果我们只希望从前到后遍历这个序列，并且只关心序列当前的值，当前的值遍历完毕之后就丢掉，那么这个存储空间实际上是额外的开销。我们希望对序列里每个数的获取是惰性的——只有当我们需要处理这个数的时候，这个数才会被计算出来。

很多时候，我们甚至无法使用这种方式，例如我们想要得到的是一个庞大的字节流，字节流式地传输给我们，我们流水线一般地处理当前字节，之后再读取下一个。

在 Python 语言和 C# 语言中，均存在 `yield` 机制来解决这个问题。例如 Python 当中我们可以：

```python
def iota(n):
    i = 0
    while i < n:
        yield i
        i += 1

for number in iota(10):
    print(number)
```

每次执行到 `yield` 时，值 `i` 都会返回给调用方，赋值给循环中的 `number`，随后执行 `print(number)`。在下一轮循环开始时，程序切换回 `iota` 函数的 `yield` 处继续执行。如果我们添加一些输出：

```python
def iota(n):
    i = 0
    while i < n:
        yield i
        print(f'In iota: {i}')
        i += 1

for number in iota(10):
    print(number)
```

我们就会看到两个函数交替地执行：

```bash
0
In iota: 0
1
In iota: 1
2
In iota: 2
...
9
In iota: 9
```

这种机制在 Python 中被称为“生成器”。

C# 中也有类似的 `yield return` 机制：

```csharp
IEnumerable<int> Iota(int n)
{
    for (int i = 0; i < n; ++i)
    {
        yield return i;
    }
}

foreach (var v in Iota(10))
{
    Console.WriteLine(v);
}
```

和 Python 的执行过程是类似的。

### 异步

对于一些 I/O 较为密集的程序，例如网络应用，C\# 和 JavaScript（TypeScript）都存在基于 `async` 和 `await` 的异步机制。

**由于异步机制和平时我们的同步的程序差别较大，对于异步机制不是很熟悉的读者，可以跳过这一例子。**

当程序存在较多 IO 操作时，例如客户端向服务器发送网络请求，客户端需要等待服务器的响应。我们通常希望这个响应不会占据一个单独的线程，这样会较多地消耗系统的资源，降低程序的并发能力。

例如，在 JavaScript 中，我们可以异步地等待服务器的响应（我们以 `200 OK` 为例）并赋值给 `response` 变量：

```javascript
let response = await Promise.resolve('200 OK'); // 此处使用 `Promise.resolve` 本地构造一个伪响应
```

或 C\# 中等价地有：

```csharp
var response = await Task.FromResult("200 OK");
```

在等待服务器响应的过程中，等待过程是不会占据线程资源的，当前的执行上下文会由 JavaScript 或 C\# 语言提供的调度器切换出当前线程，线程会空闲下来可以被再次利用。

## 协程入门：从编写一个序列生成的案例做起

我们接下来就使用前面提到的序列生成作为例子，一边实现序列生成，一边学习协程。

C++23 标准中给我们提供了 `std::generator`，例如下面的案例中，我们可以很轻松地实现这个功能：

```c++
/*
 * File: main.cpp
 */

#include <generator>
#include <iostream>
#include <print>

std::generator<int> iota(int n) {
    for (int i = 0; i < n; ++i) {
        co_yield i;
    }
}

int main() {
    for (int number : iota(10)) {
        std::println(std::cout, "{}", number);
    }
    return 0;
}
```

其中，`iota` 是一个协程，`co_yield` 关键字可以让我们的协程 `iota` 暂时先返回当前的数字 `i`，类似于 Python 中的 `yield` 和 C\# 中的 `yield return`。我们使用 GCC 14，指定 `-std=c++23` 即可编译：

```bash
g++-14 -std=c++23 -O2 -Wall -Wpedantic -Wextra main.cpp
```

或使用最新的 MSVC，指定标准为 `/std:c++23`。

当然，我们现在学习协程，自然不是为了使用这么简单的封装好的 `std::generator` 即可，我们需要的是对协程的语法有一个系统性的了解。因此，我们将自己手动实现一个极简版本的 `std::generator`，我们将它命名为 `Generator`。

我们希望实现如下的功能：

```cpp
/*
 * File: main.cpp
 */

#include <coroutine>  // 使用协程需要包含此头文件
#include <iostream>
#include <print>

class Generator {
    // ...
};

Generator iota(int n) {
    for (int i = 0; i < n; ++i) {
        co_yield i;
    }
}

int main() {
    for (int number : iota(10)) {
        std::println(std::cout, "{}", number);
    }
    return 0;
}
```

我们的目标便是补全这个 `Generator` 的实现，来让这段代码成功运行。

我们采用需求驱动（编译器驱动）的方法，不断地编译及运行此段代码，把编译器提示我们缺少的功能添加上，直到这段代码能够完美运行为止。

我们本次采用报错较为友好的 Clang 18 编译器，编译命令如下：

```bash
clang++-18 -std=c++23 -O2 -Wall -Wpedantic -Wextra main.cpp
```

如果本地不具有 Clang 18 编译器的读者可以使用在线编译器 [Compiler Explorer](https://gcc.godbolt.org/z/sn69WaEo4)。

首先，编译器给予我们的编译报错如下：

```bash
main.cpp:9:11: error: this function cannot be a coroutine: 'std::coroutine_traits<Generator, int>' has no member named 'promise_type'
    9 | Generator iota(int n) {
      |           ^
```

这个报错，是需要我们的 `Generator` 具有 `promise_type` 子类型。因此我们将 `Generator` 的代码加上这个子类型：

```c++
class Generator {
public:
    class promise_type {};
};
```

那么，`promise_type` 是什么意思呢？

在 C++ 中，每一次对协程的调用，都唯一地关联一个 promise 对象。通过 promise 对象，协程可以获取我们在 `promise` 对象中定义的协程的行为（例如何时挂起协程，何时协程继续运行）。同时，promise 对象也被用来让协程提交计算结果，或是运行过程中抛出的异常。而 `promise_type` 就是这个 promise 对象的类型。

每次，当我们调用协程的起始，promise 对象又会被动态地创建，创建完毕后才会开始运行或挂起协程。

> 值得一提的是，协程的状态，包括 promise 对象、传入协程的参数、协程内的一些局部变量和临时变量，都会在协程调用的起始时使用 `operator new` 动态地创建存储空间来存储。

我们继续来编译我们加上 `promise_type` 子类型后的代码，报错如下：

```bash
main.cpp:10:11: error: no member named 'initial_suspend' in 'Generator::promise_type'
   10 | Generator iota(int n) {
      |           ^~~~
main.cpp:12:9: error: no member named 'yield_value' in 'Generator::promise_type'
   12 |         co_yield i;
      |         ^~~~~~~~
```

可以看到，它要求我们的 `promise_type` 类型必须有 `initial_syspend` 和 `yield_value` 两个成员函数。它们是做什么的呢？

首先，`initial_syspend` 成员函数会在 promise 对象创建之后被调用，协程会根据这个成员函数的返回值来判断在协程被第一次调用后，应当立刻开始运行这个协程，还是应该先挂起这个协程并将程序的执行权交还给调用者。

我们根据之前序列生成的例子可以看到，我们希望的效果是，当我们调用协程时，协程并不立刻开始执行，而是当我们需要用到的下一个值的时候再开始执行协程来获取下一个值。因此，我们希望协程在创建后立刻返回到调用处，而不开始执行协程。

因此我们需要 `initial_syspend`  成员函数返回表示协程始终不立刻开始执行的返回值。这样的返回值，C++ 标准库已经帮助我们封装好了，封装为了 `std::suspend_always` 类型。相应地，假使我们希望协程立刻开始执行，应当返回 `std::suspend_never`。代码如下：

```c++
class Generator {
public:
    class promise_type {
    public:
        [[nodiscard]] std::suspend_always initial_suspend() const noexcept {
            return {};  // 返回一个 std::suspend_always 对象
        }
    };
};
```

关于 `std::suspend_always` 和 `std::suspend_never` 的实现，我们在此处暂不做深究，我们将会在以后更加进阶的内容中进行讲解。

然后我们来关注它要求的 `yield_value` 成员函数。顾名思义，很明显 `yield_value` 函数是当我们执行 `co_yield` 的时候被调用的函数，即表示协程 `co_yield` 了一个值，而 `co_yield` 的值将会以函数参数的形式被传入 `yield_value` 函数。因此，我们要做的就是在 `promise_type` 中将这个值保存下来，以备取用：

```c++
class Generator {
public:
    class promise_type {
    public:
        [[nodiscard]] std::suspend_always initial_suspend() const noexcept {
            return {};
        }

        [[nodiscard]] std::suspend_always yield_value(int value) noexcept {
            this->current_value_ = value;   // 将 co_yield 的值保存在数据成员中
            return {};
        }

    private:
        int current_value_;
    };
};
```

注意，`yield_value` 也是有返回值的，其返回值的含义和 `initial_syspend` 相同，是用来告诉协程，在执行 `co_yield` 之后，是应该继续向下执行，还是将执行权交还给调用者。根据我们之前序列生成的例子可以看出，我们希望当协程内部由 `co_yield` 生成一个值后，这个值立刻被调用者拿到并消费掉，等待调用者想要取用下一个值的时候再继续执行协程。因此，我们希望 `co_yield` 过后，协程挂起，执行权交还给调用者。所以，`yield_value` 的返回值我们设定为 `std::suspend_always`。

现在我们先暂时小改一下我们的 `main` 函数。现在我们的 `main` 函数是使用 range-based-for 来使用 `Generator` 的，但是让 `Generator` 支持 range-based-for 未免稍有些麻烦，我们希望把它留到最后。因此，我们先简化一下我们的 `main` 函数对 `Generator` 的调用：

```c++
int main() {
    // for (int number : iota(10)) {
    //     std::println(std::cout, "{}", number);
    // }
    auto gen = iota(10);    // 调用协程
    while (gen.Next()) {    // 开始计算下一个值。如果下一个值存在，那么返回 true；如果协程执行结束，那么返回 false
        std::println(std::cout, "{}", gen.GetValue());  // 获取新的值
    }
    return 0;
}
```

我们先给 `Generator` 声明 `Next` 和 `GetValue` 两个函数来占位：

```c++
class Generator {
public:
    class promise_type {
        // ...
    };

    bool Next();
    int& GetValue();
};
```

然后我们重新编译代码，报错信息如下：

```bash
main.cpp:26:11: error: no member named 'final_suspend' in 'promise_type'
   26 | Generator iota(int n) {
      |           ^~~~
1 error generated.
```

可以看到，它要求我们的 `promise_type` 需要 `final_suspend` 成员函数。

C++ 规定，这个 `final_suspend` 函数，会在协程退出（或执行到 `co_return` 语句）时被调用。在我们这个场景当中：

```c++
Generator iota(int n) {
    for (int i = 0; i < n; ++i) {
        co_yield i;
    }
}
```

会在 `i` 到达 `n` 值，跳出 `for` 循环，随后退出 `iota` 时被调用。

与 `initial_suspend` 类似，协程需要的仍然是这个函数的返回值。若返回值为 `suspend_never`，则协程的全部状态（包括 promise 对象）会被析构，且会调用 `operator delete` 释放在协程被调用之初由 `operator new` 分配的用于存储协程状态的存储空间，此时协程的生命周期彻底结束；若返回值为 `suspend_always`，则执行权会直接返回给调用者，而不会销毁协程的状态（包括 promise 对象）。

那么我们是否需要在此时销毁呢？观察我们的调用方：

```cpp
int main() {
    // for (int number : iota(10)) {
    //     std::println(std::cout, "{}", number);
    // }
    auto gen = iota(10);    // 调用协程
    while (gen.Next()) {    // 开始计算下一个值。如果下一个值存在，那么返回 true；如果协程执行结束，那么返回 false
        std::println(std::cout, "{}", gen.GetValue());  // 获取新的值
    }
    return 0;
}
```

在我们的协程运行到结尾之后，我们是还需要切换到调用位置，判断一次 `gen.Next()` 的。因此，此时协程的状态不能被彻底销毁，否则 `gen.Next()` 的判断将触发未定义行为。因此，我们仍然需要协程的状态信息保留一段时间。所以我们的 `final_suspend` 应当返回 `suspend_always`：

```c++
class Generator {
public:
    class promise_type {
    public:
        [[nodiscard]] std::suspend_always final_suspend() const noexcept {
            return {};
        }
        // ...
    };
    // ...
};
```

我们继续来编译代码，得到如下报错信息：

```bash
main.cpp:30:11: error: no member named 'get_return_object' in 'Generator::promise_type'
   30 | Generator iota(int n) {
      |           ^~~~
```

可以看到，我们的 `promise_type` 还缺少一个 `get_return_object` 成员函数。

这个成员函数是什么意思呢？我们重新来看我们的协程：

```c++
Generator iota(int n) {
    for (int i = 0; i < n; ++i) {
        co_yield i;
    }
}
```

在这篇文章之前我们讲到过，在协程刚刚开始被调用的时候，会自动创建一个 `Generator::promise_type` 类型的 promise 对象。但细心的你发现了什么问题——协程 `iota` 实际上也是一个 C++ 函数，其返回值是一个 `Generator` 对象——至今我们还没有一个地方可以构造这个作为返回值的 `Generator` 对象！下面我们就要来定义如何构造 `Generator` 对象了！

实际上，C++ 规定，在 promise 对象构造完毕后，会调用 promise 对象的 `get_return_object` 成员函数，来获取返回值 `Generator`。即 `get_return_object` 函数的签名应当为：

```c++
Generator Generator::promise_type::get_return_object();
```

我们来思考 `Generator` 对象应该具有哪些性质。

注意到，我们的调用方在调用 `iota` 后，唯一能拿到的只有这个返回的 `Generator` 对象。而我们获取 `iota` 所计算的值，以及恢复协程的运行，等等，都要靠这个 `Generator` 对象。而我们之前，已经把协程计算的值储存在 promise 对象的 `current_value_` 数据成员当中了，且控制协程的运行或挂起都需要依赖 promise 对象。因此，我们的 `Generator` 是一个能够与这个 promise 对象交互的、对 promise 对象进行操控的一个控制句柄的封装。`Generator` 应该包含能够获取 promise 对象的数据成员 `current_value_` 的值、根据该 promise 对象进行协程的恢复和销毁等操作、判断协程是否运行结束，等等功能。而除了第一项是我们自己定义的数据成员之外，其他的操作都属于协程的通用操作——自然，C++ 的标准库已经帮助我们封装好了！

C++ 为我们提供的对 promise 对象进行操作以控制协程的封装是 `std::coroutine_handle`，我们需要做的就是让 `Generator` 对象能够通过 `std::coroutine_handle` 来操控 promise 对象。因此，我们让 `Generator` 对象储存一个 `std::coroutine_handle<promise_type>` 作为数据成员，并提供相应的构造函数如下：

```c++
class Generator {
public:
    class promise_type;
    using handle_type = std::coroutine_handle<promise_type>; // 定义一个类型别名，简化之后的编写
    
    class promise_type {
        // ...
    };
    
    explicit Generator(handle_type coro) noexcept : coro_(coro) {}  // 构造函数，保存 coroutine_handle

    bool Next();
    int& GetValue();

private:
    handle_type coro_; // 用于保存 coroutine_handle
};
```

随后，我们就可以编写根据 promise 对象来构造指向这个对象的 `Generator` 对象的代码逻辑了。根据之前的讲述，这个构造过程将由 `get_return_object` 函数完成，而 `std::coroutine_handle` 同样贴心地为我们封装好了这项功能，使用 `std::coroutine_handle::from_promise` 即可，代码如下：

```c++
class Generator {
public:
    class promise_type {
    public:
        [[nodiscard]] Generator get_return_object() {
            /*
             * 先通过 handle_type::from_promise(*this) 构造一个指向本 promise 对象的
             * coroutine_handle，再使用这个
             */
            return Generator {handle_type::from_promise(*this)};
        }
        // ...
    };
    // ...
};
```

现在我们完成了 `Generator` 对象的创建。

既有构造，必有析构。我们来考虑 `Generator` 对象的析构。

读者不知道有没有记得，我们似乎忘记了什么。在之前我们提到，协程状态的销毁，包括 promise 对象的析构，存储空间的释放，等等，在 `final_suspend` 被调用时，我们都没有做，因为我们还需要通过 `Generator` 来使用它们判断协程是否执行完成。那么，当我们的 `Generator` 对象生命周期结束后，我们的协程就彻底没有用了——因为我们不存在任何方式能够访问到这个协程。这个时候，协程的全部状态都要销毁。因此，我们将在 `Generator` 的析构函数中完成这项任务。

`std::coroutine_handle` 依然给我们封装好了销毁协程状态的操作。代码如下：

```c++
class Generator {
public:
    ~Generator() {
        if (this->coro_) {           // 为了保险起见，判断 coroutine handle 是否依然有效
            this->coro_.destroy();   // 销毁协程状态
        }
    }
    // ...
};
```

到现在，我们再一次编译这份代码，报错信息如下：

```bash
main.cpp:48:11: error: 'promise_type' is required to declare the member 'unhandled_exception()'
   48 | Generator iota(int n) {
      |           ^
```

提示我们 `promise_type` 需要有 `unhandled_exception` 成员函数。很容易理解，因为协程在执行过程中可能会抛出异常，因此我们需要定义这些异常如何处理。但是，处理协程中的异常并非简单之事，若处理不慎可能会导致未定义行为，尤其是当协程之间存在嵌套行为时。但处理异常并不是我们目前的重点，我们只是通过一个简易的 `Generator` 来入门协程，因此我们在这里不对异常做过多的处理，如果发生异常直接终止程序：

```c++
#include <exception>

class Generator {
public:
    class promise_type {
    public:
        void unhandled_exception() {
            std::terminate();
        }
        // ...
    };
    // ...
};
```

> 值得一提的是，在 `libstdc++` 中，C++23 的 `std::generator` 实现了一个协程栈，对单层或最底层的协程来说会直接抛出异常，高层的协程则会保存异常。

我们再次编译程序，已经可以通过编译了，剩下的工作就是实现 `Next` 和 `GetValue` 了。我们很容易实现：

```c++
class Generator {
public:
    class promise_type {
        // ...
        friend class Generator;     // 用于让 Generator 访问 current_value_
    };

    bool Next() {
        this->coro_.resume();       // std::coroutine_handle::resume 恢复协程运行至下一个挂起点
        return !this->coro_.done(); // std::coroutine_handle::done 可以判断协程是否运行完成
    }

    int& GetValue() {               // std::coroutine_handle::promise() 返回 promise 对象的引用
        return this->coro_.promise().current_value_;
    }

private:
    handle_type coro_;
};
```

至此，我们的 `Generator` 的基本功能的编写完成了。

我们希望进一步实现更优雅的 range-based-for 的访问：

```c++
int main() {
    for (int number : iota(10)) {
        std::println(std::cout, "{}", number);
    }
    // auto gen = iota(10);
    // while (gen.Next()) {
    //     std::println(std::cout, "{}", gen.GetValue());
    // }
    return 0;
}
```

在这里，我们需要为 `Generator` 实现 `begin` 和 `end` 函数，以及迭代器 `iterator`。一个极简的实现如下：

```c++
#include <iterator>

class Generator {
public:
    class iterator;

    class promise_type {
    public:
        // ...
        friend class Generator::iterator;
    };
    
    class iterator {
    public:
        explicit iterator(handle_type coro) : coro_(coro) {
            this->coro_.resume();
        }

        int& operator*() const noexcept {
            return this->coro_.promise().current_value_;
        }

        iterator& operator++() {
            this->coro_.resume();
            return *this;
        }

        void operator++(int) {
            ++*this;
        }

        [[nodiscard]] bool operator==(std::default_sentinel_t) const noexcept {
            return this->coro_.done();
        }

    private:
        handle_type coro_;
    };
    
    iterator begin() const {
        return iterator {this->coro_};
    }

    std::default_sentinel_t end() const noexcept {
        return std::default_sentinel;
    }
};
```

现在我们就完成了一个相对完整的 `Generator`。当然，还有很多功能没有实现，例如如何防止多次 `begin` 调用，也没有进行异常处理，等等，目前的实现鲁棒性很差。

为了使我们的 `Generator` 更加优雅，我们添加一些小的实现细节，并让 `Generator` 泛型化。相对优雅的实现如下，有兴趣的读者可以探索如何防止多次 `begin` 调用等等：

```c++
#include <coroutine>
#include <exception>
#include <iostream>
#include <iterator>
#include <print>
#include <type_traits>
#include <utility>

template <typename T>
class Generator {
public:
    class promise_type;
    class iterator;
    class const_iterator;
    using handle_type     = std::coroutine_handle<promise_type>;
    using value_type      = T;
    using reference       = T&;
    using const_reference = const T&;
    using pointer         = T*;
    using const_pointer   = const T*;

    class promise_type {
    public:
        [[nodiscard]] std::suspend_always initial_suspend() const noexcept {
            return {};
        }

        [[nodiscard]] std::suspend_always yield_value(const value_type& value) noexcept(
            std::is_nothrow_copy_assignable_v<value_type>) {
            this->current_value_ = value;
            return {};
        }

        [[nodiscard]] std::suspend_always yield_value(value_type&& value) noexcept(
            std::is_nothrow_move_assignable_v<value_type>) {
            this->current_value_ = std::move(value);
            return {};
        }

        [[nodiscard]] std::suspend_always final_suspend() const noexcept {
            return {};
        }

        [[nodiscard]] Generator get_return_object() {
            return Generator {handle_type::from_promise(*this)};
        }

        void unhandled_exception() {
            std::terminate();
        }

    private:
        value_type current_value_;

        friend class Generator;
        friend class Generator::iterator;
    };

    class iterator {
    public:
        using value_type = Generator::value_type;
        using reference  = Generator::reference;
        using pointer    = Generator::pointer;

        explicit iterator(handle_type coro) : coro_(coro) {
            this->coro_.resume();
        }

        iterator(const iterator&)                = delete;
        iterator(iterator&&) noexcept            = default;
        iterator& operator=(const iterator&)     = delete;
        iterator& operator=(iterator&&) noexcept = default;

        reference operator*() const noexcept {
            return this->coro_.promise().current_value_;
        }

        iterator& operator++() {
            this->coro_.resume();
            return *this;
        }

        void operator++(int) {
            ++*this;
        }

        [[nodiscard]] bool operator==(std::default_sentinel_t) const noexcept {
            return this->coro_.done();
        }

    private:
        handle_type coro_;
    };

    class const_iterator : private iterator {
    public:
        using value_type = Generator::value_type;
        using reference  = Generator::const_reference;
        using pointer    = Generator::const_pointer;

        explicit const_iterator(handle_type coro) : iterator(coro) {}

        reference operator*() const noexcept {
            return iterator::operator*();
        }

        const_iterator& operator++() {
            iterator::operator++();
            return *this;
        }

        void operator++(int) {
            iterator::operator++(0);
        }
    };

    iterator begin() {
        return iterator {this->coro_};
    }

    const_iterator begin() const {
        return const_iterator {this->coro_};
    }

    const_iterator cbegin() const {
        return const_iterator {this->coro_};
    }

    std::default_sentinel_t end() const noexcept {
        return std::default_sentinel;
    }

    std::default_sentinel_t cend() const noexcept {
        return std::default_sentinel;
    }

    explicit Generator(handle_type coro) noexcept : coro_(coro) {}

    Generator(const Generator&)                = delete;
    Generator(Generator&&) noexcept            = default;
    Generator& operator=(const Generator&)     = delete;
    Generator& operator=(Generator&&) noexcept = default;

    ~Generator() {
        if (this->coro_) {
            this->coro_.destroy();
        }
    }

    bool Next() {
        this->coro_.resume();
        return !this->coro_.done();
    }

    value_type& GetValue() {
        return this->coro_.promise().current_value_;
    }

private:
    handle_type coro_;
};

#include <string>

Generator<std::string> iota(int n) {
    for (int i = 0; i < n; ++i) {
        co_yield std::to_string(i) + " generated.";
    }
}

int main() {
    for (auto& number : iota(10)) {
        std::println(std::cout, "{}", number);
    }
    return 0;
}
```

**受限于笔者的个人能力，如果本文档有错误，欢迎在 GitHub 上提出 issue 指出。**

## `suspend_always` 和 `suspend_never` 的奥妙

未完待续……

## 协程进阶：实现异步

未完待续……

## 协程中的异常处理

未完待续……

