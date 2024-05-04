# 返回值优化

> Copyright (C) 2023-2024 Timothy Liu
>
> [Creative Commons — 署名-相同方式共享 4.0 国际 — CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-Hans) 许可证

## 前言

本文章是为了补充某大学某专业的程序设计课程而写，因此内容可能较为浅薄，请读者见谅。

## 调用了几次构造函数和析构函数？

在某大学的程序设计课程的期末考试题中经常出现诸如这样的无聊的题：

```c++
// 请写出下面程序的输出

#include <iostream>

using namespace std;

class Foo {
public:
    Foo() {
        cout << "默认构造函数被调用！" << endl;
    }

    Foo(const Foo&) {
        cout << "复制构造函数被调用！" << endl;
    }

    ~Foo() {
        try {
            cout << "析构函数被调用！" << endl;
        } catch (...) {
            
        }
    }

    Foo& operator=(const Foo&) {
        cout << "赋值运算符被调用！" << endl;
        return *this;
    }

    Foo operator+(Foo) {
        return Foo();
    }

    Foo operator-(Foo) {
        Foo foo;
        return foo;
    }
};

int main() {
    Foo f1, f2;
    Foo f3 = f1 + f2;
    Foo f4;
    f4 = f1 + f2;
    Foo f5 = f1 - f2;
    Foo f6;
    f6 = f1 - f2;

    (void)f3;
    (void)f4;
    (void)f5;
    (void)f6;
}
```

然后这次考试就在不给语言标准、不给编译环境的情况下让同学们写出这道题的输出。不过，基于这门课程中讲课时使用的都是 VS2008 的 Debug 模式的默认配置这个事实，考试大概也默认了是这个编译环境了。

但是，这段程序，在不同的编译环境下确实会出现不同的输出结果。

## C++98/03 标准

上面那个程序太过繁琐，我们来看一段简单的程序：  

```cpp
class Foo {};

Foo GetFoo() {
    return Foo();
}

int main() {
    Foo foo = GetFoo();
    (void)foo;
}
```

按照 C++98/03 标准，这段程序应该是，`main` 函数中调用 `GetFoo` 时，在 `GetFoo` 函数中先使用默认构造函数构造一个[临时对象](https://zh.cppreference.com/w/cpp/language/lifetime#.E4.B8.B4.E6.97.B6.E5.AF.B9.E8.B1.A1.E7.9A.84.E7.94.9F.E5.AD.98.E6.9C.9F) `Foo()`，然后让这个临时对象去[复制构造](https://zh.cppreference.com/w/cpp/language/return#.E8.A7.A3.E9.87.8A)返回值。当函数返回后，返回值再去复制构造 `main` 函数中的 `foo`。

使用 `g++ -std=c++98 -fno-elide-constructors` 命令进行编译（之后解释为什么要加 `-std=c++98` 和 `-fno-elide-constructors`），并在构造函数、析构函数中添加输出，即可看到现象。

## 返回值优化

但是，我们发现，这样的过程是特别繁琐的，我们明明只需要 `foo` 一个对象，但是却白白多构造了两个！尤其是当对象非常大，并且存在深拷贝时，两次复制构造的开销是可能是不可接受的！

这就引入了我们的一个概念：**返回值优化**（RVO，Return Value Optimization）。

返回值优化能够保证，对于我们上述的代码，**只在 `GetFoo` 函数内进行一次默认构造，并不会进行任何的复制构造**。也就是说，程序中**运行全程只有一次对象构造**。

对于 GCC、Clang、MSVC（使用 Visual Studio 的 Debug 或 Release 默认配置，即 `/Od` 及以上）来说，返回值优化是默认开启的。对于前两者，我们可以通过加上 `-fno-elide-constructors` 来禁止返回值优化；而对于 MSVC 来说，[没有任何办法禁止返回值优化](https://social.microsoft.com/Forums/Windows/zh-CN/a5f9ccf7-c734-4e9a-8174-ee722ff7a1dd/how-to-disable-return-value-optimization-in-vs)。但是，通常情况下，我们没有理由禁止返回值优化。

但是需要注意的是，返回值优化并非 C++98/03 标准强制要求。因此，下面的代码是错误的：

```cpp
class Foo {
    Foo(Foo&) {}
};

Foo GetFoo() {
    return Foo();  // Compile Error
}

int main() {
    Foo foo = GetFoo();  // Compile Error
    (void)foo;
}
```

因为，虽然编译器执行了返回值优化，不会真正地调用复制构造函数，但是按照标准还是要有复制构造函数的调用。而我们的复制构造函数的参数定义为了（左值）引用（需要注意这通常情况下不是一个好的设计），其只能引用[左值](./lvalue-and-rvalue.md)，但 `Foo()` 和 `GetFoo()` 的返回值都不是左值，因此按照标准要求，没有匹配的复制构造函数可用，因此还是会报错。

返回值优化是一项比较古老的技术，[二十世纪的 C++ 编译器就已经支持返回值优化了](https://www.youtube.com/watch?v=3Ud9HryMUqA)。

## 具名返回值优化

我们还有另外一种情况：

```cpp
class Foo {};

Foo GetFoo() {
    Foo foo;
    return foo;
}

int main() {
    Foo foo = GetFoo();
    (void)foo;
}
```

这次，如果没有任何的优化，按照 C++98/11 的语言标准上要求，我们首先需要调用默认构造函数来构造 `GetFoo` 函数内的 `foo`，再使用其复制构造返回值，最后用返回值复制构造 `main` 函数中的 `foo`。

如果仅考虑上面的返回值优化，我们并不能把两次复制构造均优化掉，因为 `return` 语句中 `return` 后的表达式并不是一个临时对象，那么返回值优化最多只能给我们优化掉一次复制构造。

这时，我们要引入一个新的概念：**具名返回值优化**（NRVO，Named Return Value Optimization）。这种优化允许具名对象充当 `return` 后的表达式时，同样能够进行优化，仅在该具名对象构造的位置进行一次构造，不会进行任何复制构造。

对于 GCC 和 Clang 来说，具名返回值优化是默认开启的，也可以使用 `-fno-elide-constructors` 来关闭。对于 MSVC 来说，在 Visual Studio 2022 17.4 之前，当优化选项为 `/O1`、`/O2`、`/Ox` 时会开启具名返回值优化，而优化选项为 `/Od` 时则不会开启；[自 Visual Studio 2022 17.4 起，只要开启了 `/Zc:nrvo`、`/std:c++20`、`/permissive-` 中的任何一个，则即使在 `/Od` 优化下也会开启具名返回值优化](https://learn.microsoft.com/zh-cn/visualstudio/releases/2022/release-notes-v17.4#summary-of-whats-new-in-this-release-of-visual-studio-2022-version-174)。

## C++11 标准

C++11 标准引入了[右值引用和移动语义](./rvalue-reference-and-move-semantics.md)。因此对于之前所述的返回值优化的情况，如果该类定义了移动构造函数的话，那么标准要求的将不会是两次复制构造，而是两次移动构造。

但是，对于前面所述的具名返回值优化，由于 `return` 后面的表达式是左值，如果按照原本的规定，应当还是会进行一次复制构造的。但是，C++11 在此处做了一个特别的规定——在 `return` 后面的表达式（如果可能的话）[将会被自动当作右值表达式](https://zh.cppreference.com/w/cpp/language/return#.E8.87.AA.E5.8A.A8.E4.BB.8E.E5.B1.80.E9.83.A8.E5.8F.98.E9.87.8F.E5.92.8C.E5.BD.A2.E5.8F.82.E7.A7.BB.E5.8A.A8)，从而调用移动构造函数，而不去调用复制构造函数。

## 复制/移动消除

值得一提的是，C++98/03 标准中便允许实现进行[**复制消除**](https://zh.cppreference.com/w/cpp/language/copy_elision)（C++11 中增加了移动消除），即在一定条件下可以省略对象的复制构造（或移动构造）。RVO 和 NRVO 便是复制/移动消除的一种情况。但复制/移动消除在 C++14 以前并不是强制要求的。

## C++17 标准

可以看到，在不执行复制/移动消除的情况下，C++11 已经要求是两次移动构造了。但是，遍观主流的编译器实现，返回值优化几乎已经成了标配，几乎所有的编译器都会做返回值优化。因此，标准的要求就与主流编译器的实现大相径庭。此外由于[其他的一些原因](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/p0135r0.html)，C++17 标准决定对复制/移动消除中的部分情况做出强制性要求。因此，C++17 引入了[临时量实质化](https://zh.cppreference.com/w/cpp/language/implicit_conversion#.E4.B8.B4.E6.97.B6.E9.87.8F.E5.AE.9E.E8.B4.A8.E5.8C.96)的概念，重新定义了临时对象的创建条件，让众多情况下不进行临时对象的创建。这样做的作用效果之一便是返回值优化在标准中得到了保证，编译器被强制要求进行返回值优化。这样，在 C++17 标准中，之前所述的情形中标准不再要求调用复制构造函数或移动构造函数了（因此之前所说的由于标准要求而无法通过编译的代码在 C++17 标准中也可以通过编译了）。不过，具名返回值优化还不是标准强制要求的。


