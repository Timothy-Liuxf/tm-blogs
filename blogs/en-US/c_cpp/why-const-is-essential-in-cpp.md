# Why `const` is essential in C++

> Copyright (C) 2024 Timothy Liu
>
> [Creative Commons - Attribution-ShareAlike 4.0 International - CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) License

## Preface

Please note that this article is written to supplement a programming course for a certain major at a certain university, so the content may not be very in-depth.

## What will happen if `const` is missing?

In some programming lessons at some universities, there's usually some code like this:

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

For beginners, it seems that the code is okay since it can be compiled successfully. However, it has many problems, in fact.

First, the most obvious problem is that if we want to define a const object with type `Complex` and don't want it to be modified, we can write as below:

```cpp
const Complex zero(0.0, 0.0);
// cout << zero.getReal() << endl; // Compile error!
```

The code at Line 2 is incorrect because non-const member functions cannot be called on a const object. Therefore, we should define the member function as a const member function (`double getReal() const`).

Someone would say that they don't want to define const objects so that they don't need to add the `const` keyword, right? Then let's add a function to calculate the modulus of a complex number:

```c++
#include <cmath>
double cabs(Complex& z)
{
    return std::sqrt(z.getReal() * z.getReal() + z.getImag() * z.getImag());
}
```

And if one day we call this function as: `cabs(Complex(0.0, 0.0))` and compile it, the compiler will give an error! Very 'amazing', well (but it seems that VS2008 will not give a compilation error, so let's ignore VS2008). But why? Note that what we called 'reference' typically can only be initialized with an [lvalue expression](./lvalue-and-rvalue.md) (after the rvalue reference is introduced into C++11, the original reference is also called 'lvalue reference'), but `Complex(0.0, 0.0)` is an rvalue expression, thus cannot be referenced by lvalue references. Then how should we change the code? One approach is to change the parameter to `Complex z`. However, for some types, copying their objects may cause much overhead, or the copy constructor cannot be accessed or [is deleted](https://en.cppreference.com/w/cpp/language/function#Deleted_functions), so the parameter must be a reference. Then we can use `const` to solve this problem. [In C++, lvalue references to const-qualified (but not volatile-qualified) types can be initialized with both lvalue expressions and rvalue expressions.](https://en.cppreference.com/w/cpp/language/reference_initialization) So the function can be rewritten as below:

```c++
double cabs(const Complex& z)
{
    return std::sqrt(z.getReal() * z.getReal() + z.getImag() * z.getImag());
}
```

And there's another problem: we can only call const member functions through a reference to const-qualified types, but `getReal` and `getImag` are not const-qualified, so there will still be a compilation error. Thus, `getReal` and `getImag` should also be declared to be const-qualified.

In addition, as for copy constructors, for the same reason, the parameters of most copy constructors should be references to const-qualified types.

**Not finished...**

## When should we use `const`?

If a member function doesn't change the members of the object, don't hesitate to add `const`; if a function parameter which is a pointer or a reference does not change the object it pointers to or refers to, don't hesitate to add `const`.

**Not finished...**

## Constant expressions

**Not finished...**

## One definition rule (ODR) and odr-used

**...**
