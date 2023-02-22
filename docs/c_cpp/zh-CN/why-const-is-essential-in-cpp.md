<!-- Copyright (C) 2023 Timothy Liu -->

<!-- CC BY-SA 4.0 license -->

# 为什么 `const` 在 C++ 中是必要的

## 前言

本文章是为了补充某大学某专业的程序设计课程而写，因此内容可能较为浅薄，请读者见谅。  

## 缺少了 `const` 会怎么样？

有某些大学程序设计课上经常看到诸如这样的代码：  

```c++
class Complex
{
public:
    Complex(double r, double i) : real(r), imag(i) {}
    double getReal() { return real; }
    double getImag() { return imag; }
    void setReal(double newReal) { real = newReal; }
    void setImag(double newImag) { imag = newImag; }
private:
    double real;
    double imag;
};
```

对于初学者，乍看一眼貌似只要过编译了就 OK。但是，这个设计实际上是漏洞百出的。

首先，最显然的问题，我如果要定义一个 `const`  的 `Complex` 对象，不想让其修改，那么就可以这样写：

```cpp
const Complex zero(0.0, 0.0);
// cout << zero.getReal() << endl; // Compile error!
```

第二行的代码显然会报错。因为 `const` 对象无法调用非 `const` 成员函数。因此，我们只有把 `getReal` 定义成 `const` 的才能解决问题：`double getReal() const`。

但是，如果我不想定义 `const` 对象又怎样？是不是 `getReal` 就不用加 `const` 了？我们继续看。现在我们加一个计算模长的函数：

```c++
#include <cmath>
double cabs(Complex& z)
{
    return std::sqrt(z.getReal() * z.getReal() + z.getImag() * z.getImag());
}
```

有一天我不是很爽，写了这样的代码调用这个函数：`cabs(Complex(0.0, 0.0))`。结果非常 Amazing 啊！编译错误（然而这东西在 VS2008 上貌似并不会编译错误，让我们不考虑 VS2008）。为什么呢？我们所说的传统意义上的”引用“，只能绑定到[左值](./lvalue-and-rvalue.md)（在 C++11 出现右值引用之后，原来的引用也被称作左值引用），而 `Complex(0.0, 0.0)` 这是个右值表达式，因此并没有办法被引用。那怎么改呢？一个方法是把参数改成 `Complex z`。但是如果对于一些其他的类型，复制其对象可能会引来很大的开销，或者是该类型的复制构造函数不可访问或[已经标记为删除](https://zh.cppreference.com/w/cpp/language/function#.E5.BC.83.E7.BD.AE.E5.87.BD.E6.95.B0)，因此我们还是希望参数为音乐。那么，`const` 就派上用场了。[对有 `const` 限定（但没有 `volatile` 限定）的类型的左值引用既可以绑定到左值，又可以绑定到右值](https://zh.cppreference.com/w/cpp/language/reference_initialization)。所以函数改为：

```c++
double cabs(const Complex& z)
{
    return std::sqrt(z.getReal() * z.getReal() + z.getImag() * z.getImag());
}
```

但是现在问题又来了：对于对有 `const` 限定的类型的引用，只能调用其绑定对象的带有 `const` 限定的成员函数，而 `getReal` 和 `getImag` 两个成员函数并没有 `const` 限定，因此还是会编译报错。因此，`getReal` 和 `getImag` 也是要声明为有 `const` 限定的成员函数。

此外就是复制构造函数的问题。由于类似的原因，绝大多数复制构造函数的参数都是对带有 `const` 限定的类型的引用。

**未完待续……**

## 什么时候该加 `const`？

如果一个成员函数不会改变类内的成员，那么请毫不犹豫地加上 `const`；如果一个以指针或引用传递的函数参数不会改变其引用或指向的对象，那么也请毫不犹豫地加上 `const`。

**未完待续……**

## 常量表达式

**未完待续……（继续鸽 x）**

<!-- 常量表达式、常量折叠，等等 -->

