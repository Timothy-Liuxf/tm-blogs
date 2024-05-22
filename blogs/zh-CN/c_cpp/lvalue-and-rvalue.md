# 左值与右值

> Copyright (C) 2023-2024 Timothy Liu
>
> [Creative Commons — 署名-相同方式共享 4.0 国际 — CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-Hans) 许可证

## 前言

本文章是为了补充某大学某专业的程序设计课程而写，因此内容可能较为浅薄，请读者见谅。

## 什么是左值与右值

**左值**（lvalue）是 C 语言即存在的概念，与之相对的通常称为**右值**（rvalue），C 语言称为**非左值**（non-lvalue）。而 C++ 在一定程度上也继承了 C 语言对这一概念的阐述。

在 C 语言和 C++ 语言中，任何一个**表达式（expression）**都具有两个属性——**类型（type）**和**值类别（value category）**。而左值和右值就是表达式的值类别。因此，“左值”和“右值”都是表达式具有的属性，所以我们说“左值”还是“右值”都是针对于表达式而言的。一旦脱离了表达式，我们就无从讨论“左值”与“右值”。这一点是尤其需要注意的。

我们先来窥探一下左值和右值名称的由来。“左值”，最初的名称由来是该表达式放在赋值号的左边，而“右值”是放在赋值号的右边。但是现在通过赋值号左右判断左右值已经不准确了。有一种说法是，能够取地址的表达式是左值，不能取地址的表达式是右值。但这种说法太过结果化，不能体现左值和右值的定义。

我们先来考虑 C 语言的定义。C 语言标准中的“左值”定义自 C89 起便没有太大变化。C11 中是这样定义的（ISO/IEC 9899: 2011）：

> **6.3.2.1 Lvalues, arrays, and function designators**
>
> 1. An *lvalue* is an expression (with an object type other than void) that potentially designates an object.

对于“右值”，C 语言标准并没有给出明确定义，只是在该页做了脚注：

> 69) ... What is sometimes called ‘‘rvalue’’ is in this International Standard described as the ‘‘value of an expression’’.

通过以上定义可以看出，简单但不严谨地说，所谓“左值”，主要是指该表达式的求值结果是一个真正存在的“对象”，否则该表达式就是右值。如果更加形象通俗一点地说，一个变量（注意 C 语言中没有严格定义“变量”的概念，可以简单将 C 语言的“变量”理解成“对象”，从而不影响这种表述也适用于 C 语言）可以看作是一个“盒子”，里面装着这个变量所储存的“内容”。而“左值”则指的是该表达式的结果是这个“盒子”本身，而“右值”则指的是表达式的结果是“盒子”里装着的“内容”。

例如，`int x = 5;` 定义了一个变量 `x`，这个 `x` 就成为了一个“盒子”，里面装着“5”这样一个“内容”。因此，我们可以对 `x` 进行赋值等操作，例如赋值表达式 `x = 8` 中，`=` 左侧的表达式 `x` 就是一个左值表达式，即该表达式的求值结果指的是 `x` 这个“盒子”，而非 `x` 装的“内容” `5`。而 `8` 则是一个右值表达式，因为我们并没有创建任何的存储 `8` 这个内容的“盒子”。

当然以上说法并不是完全准确，也是存在例外的。C 语言存在特别规定：

> **6.2.4 Storage durations of objects**
>
> 8. A non-lvalue expression with structure or union type, where the structure or union contains a member with array type (including, recursively, members of all contained structures and unions) refers to an object with automatic storage duration and *temporary lifetime*. 36) Its lifetime begins when the expression is evaluated ...

也就是说，如果一个右值表达式的类型是一个结构体或联合体，且该结构体或联合体有数组作为其成员，则该右值表达式在求值时会产生一个具有临时生命周期的对象。

一般来说，整数和浮点数的[字面量](https://zh.cppreference.com/w/c/language/expressions#.E5.B8.B8.E9.87.8F.E5.8F.8A.E5.AD.97.E9.9D.A2.E9.87.8F)（literal）所直接构成的表达式是右值，例如 `5`、`3.14`，等等；C 语言中函数调用表达式都是右值，例如一个函数为 `int func(void)`，则 `func()` 表达式是右值；类型转换表达式都是右值；算术表达式、逻辑表达式、赋值表达式等一系列表达式都是右值，等等。

C++98 则相对更加复杂，并且与 C 语言有很多不同。例如，C++98 中，赋值表达式、复合赋值表达式（诸如 `x = 5`、`y += 3` 等）都是左值表达式（指代被赋值的对象）；对于函数调用表达式，若该函数的返回值是一个左值引用，则是左值表达式。例如 `int& func()`，则表达式 `func()` 是左值表达式。（左值）引用是对一个真正存在的对象的引用，也就是对装着值的“盒子”本身的引用。如此看来，它是一个左值也就理所当然了。

当然以上所述均有例外。例如在 C 和 C++ 中，[字符串字面量](https://zh.cppreference.com/w/cpp/language/string_literal)（string literal），如 `"Hello, world!"`，被规定为左值；在 C99 以后，[复合字面量](https://zh.cppreference.com/w/c/language/compound_literal)（compound literal）被规定为左值，等等。

### 左值到右值转换

（未完待续）

## C++11

在 C++11 中，表达式的值的划分发生了变化。一个表达式可以分为：**左值**（lvalue）、**亡值**（xvalue）、**纯右值**（prvalue）。其中，左值和亡值合称为**泛左值**（glvalue），亡值和纯右值合称为**右值**（rvalue）。 

（未完待续）

## 参考文献

1. ISO/IEC 9899: 2011
2. ISO/IEC 14882: 1998
3. ISO/IEC 14882: 2011
4. <https://en.cppreference.com/>
5. <https://zh.cppreference.com/>
