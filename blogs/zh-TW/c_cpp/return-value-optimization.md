# 傳回值最佳化

> Copyright (C) 2024 Timothy Liu
>
> [Creative Commons — 姓名標示-相同方式分享 4.0 國際 — CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh_TW) 授權條款

## 前言

本文章是為了補充某大學某專業的程式設計課程而寫，因此内容可能較為淺薄，請讀者見諒。

## 呼叫了幾次建構函式和解構函式？

在某大學的程式設計課程的期末考試題中經常出現諸如這樣的無聊的題：

```c++
// 請寫出下面程式的輸出

#include <iostream>

using namespace std;

class Foo {
public:
    Foo() {
        cout << "預設建構函式被呼叫！" << endl;
    }

    Foo(const Foo&) {
        cout << "複製建構函式被呼叫！" << endl;
    }

    ~Foo() {
        try {
            cout << "解構函式被呼叫！" << endl;
        } catch (...) {
            
        }
    }

    Foo& operator=(const Foo&) {
        cout << "指派運算子被呼叫！" << endl;
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

然後這次考試就在不給語言標準，不給編譯環境的情況下讓同學們寫出這道題的輸出。不過，基於這門課程中講課時使用的都是 VS2008 的 Debug 模式的預設組態這個事實，考試大概也預設了是這個編譯環境了。

但是，這段程式，在不同的編譯環境下確實會出現不同的輸出結果。

## C++98/03 標準

上面那個程式太過繁瑣，我們來看一段簡單的程式：

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

按照 C++98/03 標準，這段程式應該是，`main` 函式中呼叫 `GetFoo` 時，在 `GetFoo` 函式中先使用預設建構函式建構一個[暫存物件](https://zh.cppreference.com/w/cpp/language/lifetime#.E4.B8.B4.E6.97.B6.E5.AF.B9.E8.B1.A1.E7.9A.84.E7.94.9F.E5.AD.98.E6.9C.9F) `Foo()`，然後讓這個暫存物件去[拷貝建構](https://zh.cppreference.com/w/cpp/language/return#.E8.A7.A3.E9.87.8A)傳回值。當函式傳回后，傳回值再去拷貝建構 `main` 函式中的 `foo`。

使用 `g++ -std=c++98 -fno-elide-constructors` 命令進行編譯（之後解釋為什麽要加`-std=c++98` 和 `-fno-elide-constructors`），并在建構函式、解構函式中添加輸出，即可看到現象。

## 傳回值最佳化

但是，我們發現，這樣的過程是特別繁瑣的，我們明明只需要 `foo` 一個物件，但是卻白白多建構了兩個！尤其是當物件非常大，并且存在深拷貝時，兩次拷貝建構的開銷可能是不可接受的！

這就引入了一個概念：**傳回值最佳化**（RVO，Return Value Optimization）。

傳回值最佳化能夠保證，對於我們上述的程式碼，**只在 `GetFoo` 函式内進行一次預設建構，并不會進行任何的複製建構**。也就是説，程式中**執行全程只有一次物件建構**。

對於 GCC、Clang、MSVC（使用 Visual Studio 的 Debug 或 Release 預設組態，即 `/Od` 及以上）來説，傳回值最佳化的啓用是預設的。對於前兩者，我們可以通過加上 `-fno-elide-constructors` 來停用傳回值最佳化；而對於 MSVC 來説，[沒有任何辦法停用傳回值最佳化](https://social.microsoft.com/Forums/Windows/zh-TW/a5f9ccf7-c734-4e9a-8174-ee722ff7a1dd/how-to-disable-return-value-optimization-in-vs)。但是，通常情況下，我們沒有理由停用傳回值最佳化。

但是需要注意的是，傳回值最佳化并非 C++98/03 標準强制要求。因此，下面的程式碼是錯誤的：

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

因為，雖然編譯器執行了傳回值最佳化，不會真正地呼叫複製建構函式，但是按照標準還是要呼叫複製建構函式。而我們的複製建構函式的參數定義為一個（lvalue）參考（需要注意這通常情況下不是一個好的設計），其只能參考 [lvalue](./lvalue-and-rvalue.md)，但 `Foo()` 和 `GetFoo()` 的傳回值都不是 lvalue，因此按照標準要求，沒有相符的複製建構函式可用，因此還是會報錯。

傳回值最佳化是一項非常古老的技術，[二十世紀的 C++ 編譯器就已經支援傳回值最佳化了](https://www.youtube.com/watch?v=3Ud9HryMUqA)。

## 具名傳回值最佳化

我們還有另外一種情況：

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

這次，如果沒有任何的最佳化，按照 C++98/11 的語言標準上要求，我們首先需要呼叫預設建構函式來建構 `GetFoo` 函式内的 `foo`，再使用其複製建構傳回值，最後用傳回值複製建構 `main` 中的 `foo`。

如果僅考慮上面的傳回值最佳化，我們并不能把兩次複製建構均省略掉，因為 `return` 陳述式中 `return` 后的運算式并不是一個暫存物件，那麽傳回值最佳化最多只能給我們省略掉一次複製建構。

這時，我們要引入一個新的概念：**具名傳回值最佳化**（NRVO，Named Return Value Optimization）。這種最佳化允許具名物件充當 `return` 后的運算式時，同樣能夠進行最佳化，僅在該具名物件建構的位置進行一次建構，不會進行任何的複製建構。

對於 GCC 和 Clang 來説，具名傳回值最佳化是默認啓用的，也可以使用 `-fno-elide-constructors` 來停用。對於 MSVC 來説，在 Visual Studio 2022 17.4 之前，當最佳化選項為 `/O1`、`/O2`、`/Ox` 時會啓用具名傳回值最佳化，而最佳化選項為 `/Od` 時則不會啓用；[自 Visual Studio 2022 17.4 起，只要啓用了 `/Zc:nrvo`、`/std:c++20`、`/permissive-` 中的任何一個，則即使在 `/Od` 下也會啓用具名傳回值最佳化](https://learn.microsoft.com/zh-tw/visualstudio/releases/2022/release-notes-v17.4#summary-of-whats-new-in-this-release-of-visual-studio-2022-version-174)。

## C++11 標準

C++11 標準引入了 [rvalue 參考和行動語意](./rvalue-reference-and-move-semantics.md)。因此對於之前所述的傳回值最佳化的情況，如果該類別定義了移動建構函式，那麽標準要求的將不會是兩次複製建構，而是兩次移動建構。

但是，對於前面所述的具名傳回值最佳化，由於 `return` 後面的運算式是 lvalue，如果按照原本的規定，應當還是會進行一次複製建構的。但是，C++11 在此處做了一個特別的規定——在 `return` 後面的表達式（如果可能的話）[將會自動作為 rvalue 運算式](https://zh.cppreference.com/w/cpp/language/return#.E8.87.AA.E5.8A.A8.E4.BB.8E.E5.B1.80.E9.83.A8.E5.8F.98.E9.87.8F.E5.92.8C.E5.BD.A2.E5.8F.82.E7.A7.BB.E5.8A.A8)，從而呼叫移動建構函式，而不會呼叫複製建構函式。

## 複製/移動 elision

值得一提的是，C++98/03 標準中便允許實現進行[**複製 elision**](https://zh.cppreference.com/w/cpp/language/copy_elision)（C++11 中增加了移動 elision），即在一定條件下可以省略物件的複製建構（或移動建構）。RVO 和 NRVO 便是複製/移動 elision 的一種情況。但複製/移動 elision 在 C++14 以前并不是强制要求的。

## C++17 標準

可以看到，在不執行複製/移動 elision 的情況下，C++11 已經要求是兩次移動建構了。但是，遍觀主要的編譯器的實現，傳回值最佳化幾乎已經成了標配，幾乎所有的編譯器都會做傳回值最佳化。因此，標准的要求與主流編譯器的實現大相徑庭。此外由於[其他的一些原因](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/p0135r0.html)，C++17 引入了[暫存數具體化](https://zh.cppreference.com/w/cpp/language/implicit_conversion#.E4.B8.B4.E6.97.B6.E9.87.8F.E5.AE.9E.E8.B4.A8.E5.8C.96)的概念，重定義了暫存物件的創建條件，讓眾多情況下不創建暫存物件。這樣做的作用效果之一便是傳回值最佳化在標準中得到了保證，編譯器被强制要求進行傳回值最佳化。這樣，在 C++17 標準中，之前所述的情形中標準不再要求呼叫複製建構函式或移動建構函式了（因此之前所説的由於標準要求而無法通過編譯的程式碼在 C++17 標準中也可以通過編譯了）。不過，具名傳回值最佳化還不是標準强制要求的。


