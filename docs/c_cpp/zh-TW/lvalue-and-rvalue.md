<!-- Copyright (C) 2023 Timothy Liu -->

<!-- CC BY-SA 4.0 license -->

# Lvalues 與 Rvalues

## 前言

本文章是為了補充某大學某專業的程式設計課程而寫，因此内容可能較為淺薄，請讀者見諒。

## 什麽是 lvalue 與 rvalue

**左值**（lvalue）是 C 語言即存在的概念，與之相對的通常稱為**右值**（rvalue)，C 語言稱為**非左值**（non-lvalue）。而 C++ 在一定程度上也繼承了 C 語言對這一概念的闡述。

首先，需要注意的是，“lvalue”和“rvalue”都是運算式（expression）具有的屬性。因此，我們説“lvalue”還是“rvalue”都是針對於運算式而言的。一旦脫離了運算式，我們就無從討論“lvalue”與“rvalue”。

我們先來窺探一下 lvalue 和 rvalue 名稱的由來。“lvalue”，最初的名稱由來是該運算式放在指派運算子的左邊，而“rvalue”是放在指派運算子的右邊。但是現在通過指派運算子左右判斷 l/rvalue 已經不準確了。有一種説法是，能夠取位址的運算式是 lvalue，不能取位址的運算式是 rvalue。但這種説法太過結果化，不能體現 lvalue 和 rvalue 的定義。

我們先來考慮 C 語言的定義。C 語言標準中的“lvalue”定義自 C89 起便沒有太大變化。C11 中是這樣定義的（ISO/IEC 9899: 2011）：

> **6.3.2.1 Lvalues, arrays, and function designators**
>
> 1. An *lvalue* is an expression (with an object type other than void) that potentially designates an object.

對於 rvalue，C 語言標準并沒有給出明確定義，只是在該頁做了腳註：

> 69) ... What is sometimes called ‘‘rvalue’’ is in this International Standard described as the ‘‘value of an expression’’.

通過以上定義可以看出，簡單但不嚴謹地說，作為“lvalue”，主要是指該運算式的評估結果是一個物件本身存在的實體，否則該表達式就是 rvalue。如果更加形象通俗一點地說，一個變數（注意 C 語言中沒有嚴格定義“變數”的概念，可以簡單將 C 語言的“變數”理解成“物件”，從而不影響這種表述也適用於 C 語言）可以看作是一個“盒子”，裏面裝著這個變數所儲存的“内容”。而“lvalue”則指的是該運算式的結果是這個“盒子”本身，而“rvalue”則指的是運算式的結果是“盒子”裏裝著的“内容”。

例如，`int x = 5;` 定義了一個變數 `x`，這個 `x` 就成為了一個“盒子”，裏面裝著“5”這樣一個“内容”。因此，我們可以對 `x` 進行指派等操作，例如指派運算式 `x = 8;` 中，`=` 左側的運算式 `x` 就是一個 lvalue 運算式，即該運算式的評估結果指的是 `x` 這個“盒子”，而非 `x` 裝的“内容” `5`。而 `8` 則是一個 rvalue 運算式，因為我們并沒有構建任何的儲存 `8` 這個内容的“盒子”。

當然以上説法并不是完全準確，也是存在例外的。C 語言存在特別規定：

> **6.2.4 Storage durations of objects**
>
> 8. A non-lvalue expression with structure or union type, where the structure or union contains a member with array type (including, recursively, members of all contained structures and unions) refers to an object with automatic storage duration and *temporary lifetime*. 36) Its lifetime begins when the expression is evaluated ...

也就是説，如果一個 rvalue 運算式的類型是一個 struct 或 union，且該 struct 或 union 有陣列作為其成員，則該 rvalue 運算式在評估時會產生暫存對象。

一般來説，整數和浮點值的 [literal](https://zh.cppreference.com/w/c/language/expressions#.E5.B8.B8.E9.87.8F.E5.8F.8A.E5.AD.97.E9.9D.A2.E9.87.8F) 所直接構成的運算式是 rvalue，例如 `5`、`3.14`，等等；C 語言中函式呼叫運算式都是 rvalue，例如一個函式為 `int func(void)`，則 `func()` 運算式是 rvalue；類型轉換運算式都是 rvalue；算術運算式、邏輯運算式、指派運算式等一系列運算式都是 rvalue，等等。

C++98 則相對更加複雜，并且與 C 語言有很多不同。例如，C++98 中，指派運算式、複合指派運算式（諸如 `x = 5`、`y += 3` 等）都是 lvalue（指代被指派的物件）；對於函式呼叫，若該函式的傳回值是一個左值參考，則是 lvalue。例如 `int& func()`，則運算式 `func()` 是 lvalue。（左值）參考是對一個真正存在的物件的參考，也就是對裝著值的“盒子”本身的參考。如此看來，它是一個 lvalue 也就理所當然了。

當然以上所述均有例外。例如在 C 和 C++ 中，[字串常量](https://zh.cppreference.com/w/cpp/language/string_literal)（string literal），如 `"Hello, world!"`，都被規定為 lvalue；在 C99 以後，複合常量（compound literal）都被規定為 lvalue，等等

### lvalue 到 rvalue 轉換

（未完待續）

## C++11

在 C++11 中，運算式的值的劃分發生了變化。一個運算式可以分為：**lvalue**、**xvalue**、**prvalue**。其中，lvalue 和 xvalue 合稱為 **glvalue**，xvalue 和 prvalue 合稱為 rvalue。

（未完待續）

## 參考文獻

1. ISO/IEC 9899: 2011
2. ISO/IEC 14882: 1998
3. ISO/IEC 14882: 2011
4. <https://en.cppreference.com/>
5. <https://zh.cppreference.com/>
6. <https://learn.microsoft.com/zh-cn/>
7. <https://learn.microsoft.com/zh-tw/>
