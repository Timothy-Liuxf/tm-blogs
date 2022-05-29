<!-- Copyright (C) 2022 Timothy Liu -->

<!-- CC BY-SA 4.0 license -->

# 左值与右值

## 前言

本文章是为了补充某大学某专业的程序设计课程而写，因此内容可能较为浅薄，请读者见谅。  

## 什么是左值与右值

**左值**（lvalue）是 C 语言即存在的概念，与之相对的通常称为**右值**（rvalue），C++ 在一定程度上也继承了 C 语言对这一概念的阐述。那么，什么是左值和右值呢？  

我们先来窥探一下左值和右值名称的由来。“左值”，最初的名称由来是该值放在赋值号的左边，而“右值”是放在赋值号的右边。但是现在通过赋值号左右判断左右值已经不准确了。有一种说法是，能够取地址的是左值，不能取地址的是右值。但这种说法太过结果化，不能体现左值和右值的定义。

我们暂不考虑 C++11 及以后的定义（之后将会看到 C++11 及以后，对值的分类进行了扩展）。我们先来考虑 C 和 C++98/03 的定义。C 语言标准中的“左值”定义自 C89 起便没有太大变化。C11 中是这样定义的（ISO/IEC 9899: 2011）：  

> **6.3.2.1 Lvalues, arrays, and function designators**
>
> An *lvalue* is an expression (with an object type other than void) that potentially designates an object.

对于“右值”，C 语言标准并没有给出明确定义，只是在该页做了脚注：  

> 69) ... What is sometimes called ‘‘rvalue’’ is in this International Standard described as the ‘‘value of an expression’’.

C++98 则有对右值的阐述。其对左右值的阐述则是这样的（ISO/IEC 14882: 1998）：  

> **3.10 Lvalues and rvalues**
>
> 1. Every expression is either an *lvalue* or an *rvalue*.
> 2. An lvalue refers to an object or function. Some rvalue expressions—those of class or cv-qualified class type—also refer to objects 49).

通过以上定义可以看出，简单但不严谨地说，在 C++ 中，所谓“左值”，主要是指一个对象本身存在的“实体”，否则就是右值。如果更加形象通俗一点地说，一个变量可以看作是一个“盒子”，里面装着这个变量的“值”。而“左值”指的是装着这个“盒子”本身，而“右值”则指的是“盒子”里装着的“值”。  

例如，`int x = 5;` 定义了一个变量 `x`，这个 `x` 就成为了一个“盒子”，里面装着“5”这样一个值。因此，我们可以对 `x` 进行赋值等操作，例如赋值语句 `x = 8` 中，`=` 左侧的表达式 `x` 就是一个“左值”，即指的是 `x` 这个盒子，而非 `x` 装的值 `5`。而 `8` 显然，则是一个右值。 

一般来说，整数和浮点数的字面量（literal）是右值，例如 `5`、`3.14`，等等。临时对象是右值，例如 `std::string("Ohh")`。函数的返回值，若不是（左值）引用，也是右值，例如一个函数 `int func()`，调用 `func()` 后，其返回值是右值。但是，若返回值是一个左值引用，则是左值。例如 `int& func()`，则 `func()` 的返回值是左值。（左值）引用是对一个真正存在的对象的引用，也就是对装着值的“盒子”本身的引用。如此看来，它是一个左值也就理所当然了。  

当然也有例外，例如在 C 和 C++ 中，字符串字面量（string literal），如 `"Hello, world!"`，被规定为左值；在 C99 以后，复合字面量（compound literal）被规定为左值，等等。  

## C++11

在 C++11 中，表达式的值的划分发生了变化。一个表达式可以分为：**左值**（lvalue）、**亡值**（xvalue）、**纯右值**（prvalue）。其中，左值和亡值合称为**泛左值**（glvalue），亡值和纯右值合称为**右值**（rvalue）。   

具体阐述几种值的含义稍显繁琐，在此暂时不作过多展开。  

