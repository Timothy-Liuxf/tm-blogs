# Lvalue & Rvalue

> Copyright (C) 2024 Timothy Liu
>
> [Creative Commons - Attribution-ShareAlike 4.0 International - CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) License

## Preface

Please note that this article is written to supplement a programming course for a certain major at a certain university, so the content may not be very in-depth.

## What is lvalue? What is rvalue?

The concept of **Lvalue** exists in C, and the opposite concept is **rvalue**, which is called **non-lvalue** in C. And C++ inherits these concepts from C in some ways.

In both C and C++, an **expression** has two properties, **type** and **value category**, and both "lvalue" and "rvalue" are all value categories. Therefore, we should know that we CANNOT talk about lvalues and rvalues without expressions.

At first, let's explore the origin of the names "lvalue" and "rvalue". Originally, lvalue was called "lvalue" because lvalue expressions could appear on the left-hand side of an assignment operator, while rvalue was called "rvalue" because rvalue expressions could only appear on the right-hand side of an assignment operator. But these characteristics are not always right now. And there is a saying that expressions that can take addresses are lvalue expressions, and expressions that cannot take addresses are rvalue expressions. However, this statement is too consequential, and it is not the definition of "lvalue" and "rvalue".

Let's see the definition in C first. The definition of "lvalue" in the C standard has not changed a lot since C89. The definition in C11 (ISO/IEC 9899: 2011) is as below:

> **6.3.2.1 Lvalues, arrays, and function designators**
>
> 1. An *lvalue* is an expression (with an object type other than void) that potentially designates an object.

As for "rvalue", there's not a clear definition in the C standard, but there's a footnote:

> 69) ... What is sometimes called ‘‘rvalue’’ is in this International Standard described as the ‘‘value of an expression’’.

As we can see from the above definitions, simply but not rigorously, the so-called "lvalue" means the evaluation result of the expression is a real object; otherwise, the expression is an rvalue expression. If we describe it more vividly and informally, a variable (note that the concept of "variable" is not strictly defined in the C standard; here we can simply regard "variable" as "object" in C) can be regarded as a "box", inside which is the "content" it stores. And "lvalue" means the evaluation result of the expression is the "box" itself, while "rvalue" means the evaluation result of the expression is the "content".

For example, the statement `int x = 5` defines a variable `x`, and then the `x` becomes a "box", which stores the "content" "`5`". Then we can perform certain operations, such as assignment operations on `x`. For instance, in the assignment expression `x = 8`, the left-operand `x` is an lvalue expression, whose evaluation result is the "box" `x`, not the "content" "`5`" stored in `x`, while the right-operand `8` is an rvalue expression because we didn't create any "boxes" to store the "content" "`8`".

Of course, the above statement is not completely accurate. There are some exceptions. For example, there's a special rule in C:

> **6.2.4 Storage durations of objects**
>
> 8. A non-lvalue expression with structure or union type, where the structure or union contains a member with array type (including, recursively, members of all contained structures and unions) refers to an object with automatic storage duration and *temporary lifetime*. 36) Its lifetime begins when the expression is evaluated ...

It indicates that in some cases, rvalue expressions may designate objects in the C language.

In general, first, expressions directly composed by a single [literal](https://en.cppreference.com/w/c/language/expressions#Constants_and_literals) are rvalue expressions, such as `5`, `3.14`, and so on. Second, in the C language, all function call expressions are rvalue expressions. For instance, if a function is declared as `int func(void)`, the expression `func()` will be an rvalue expression. Third, all cast expressions in C are rvalue expressions, and a series of expressions such as arithmetic operator expressions, logical operator expressions, assignment expressions, etc. are all rvalue expressions.

C++98 is relatively more complex and has more differences from C. For example, in C++98, assignment expressions and compound assignment expressions (such as `x = 5`, `y += 3`, and so on) are all lvalue expressions (designate the assigned object). Function call expressions, in which the return value of the function is an lvalue reference, are lvalue expressions (i.e., the expression `func()` is an lvalue expression given the declaration `int& func()`). Note that lvalue references refer to the "box" itself, so it's natural that they are lvalue expressions.

And there are also some exceptions. In C and C++, [string literals](https://en.cppreference.com/w/cpp/language/string_literal) such as `"Hello, world!"` are specified to be lvalue expressions. And after C99, [compound literals](https://en.cppreference.com/w/c/language/compound_literal) are specified to be lvalue expressions, etc.

### Lvalue-to-rvalue conversion

(Not finished)

## C++11

In C++11, the value categories change a lot. The value category of an expression might be lvalue, xvalue or prvalue. And lvalues and xvalues are called glvalues, while xvalues and prvalues are called rvalues.

(Not finished)

## References

1. ISO/IEC 9899: 2011
2. ISO/IEC 14882: 1998
3. ISO/IEC 14882: 2011
4. <https://en.cppreference.com/>
