# 為什麽 `const` 在 C++ 中是必要的

> Copyright (C) 2023 Timothy Liu
>
> [Creative Commons — 姓名標示-相同方式分享 4.0 國際 — CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh_TW) 授權條款

## 前言

本文章是為了補充某大學某專業的程式設計課程而寫，因此内容可能較為淺薄，請讀者見諒。

## 缺少了 `const` 會怎麽樣？

有某些大學程式設計課上經常看到諸如這樣的程式碼：

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

對於初學者，乍看一眼貌似只要過編譯了就 OK。但是，這個設計實際上是漏洞百出的。

首先，最顯然的問題，我如果要定義一個 `const` 的 `Complex` 物件，不想讓其被修改，那麽就可以這樣寫：

```cpp
const Complex zero(0.0, 0.0);
// cout << zero.getReal() << endl; // Compile error!
```

第二行的程式碼顯然會報錯。因為 `const` 物件無法呼叫非 `const` 成員函式。因此，我們只有把 `getReal` 定義成 `const` 才能解決問題：`double getReal() const`。

但是，如果我不想定義 `const` 物件又怎樣？是不是 `getReal` 就不用加 `const` 了？我們繼續看。現在我們加一個計算模長的函式：

```c++
#include <cmath>
double cabs(Complex& z)
{
    return std::sqrt(z.getReal() * z.getReal() + z.getImag() * z.getImag());
}
```

有一天我不是很爽，寫了這樣的程式碼呼叫這個函式：`cabs(Complex(0.0, 0.0))`。結果非常 Amazing 啊！編譯錯誤（然而這東西在 VS2008 上貌似并不會編譯錯誤，讓我們不考慮 VS2008）。為什麽呢？我們所説的傳統意義上的“參考”，只能繫結到 [lvalue](./lvalue-and-rvalue.md)（在 C++11 出現右值參考之後，原來的參考也被稱作左值參考），而 `Complex(0.0, 0.0)` 這是個右值運算式，因此并沒有辦法被參考。那怎麽改呢？一個方法是把參數改成 `Complex z`。但是如果對於一些其他的類型，複製其物件可能會引來很大的負荷，或者是該類型的複製建構函式不可存取或[已經定義為刪除](https://zh.cppreference.com/w/cpp/language/function#.E5.BC.83.E7.BD.AE.E5.87.BD.E6.95.B0)，因此我們還是希望參數為參考。那麽，`const` 就派上用場了。[對有 `const` 限定（但沒有 `volatile` 限定）的類型的左值參考既可以繫結到左值，又可以繫結到右值](https://zh.cppreference.com/w/cpp/language/reference_initialization)。所以函式改為：

```c++
double cabs(const Complex& z)
{
    return std::sqrt(z.getReal() * z.getReal() + z.getImag() * z.getImag());
}
```

但是現在問題又來了：對於有 `const` 限定的類型的參考，只能呼叫其繫結物件的帶有 `const` 限定的成員函式，而 `getReal` 和 `getImag` 兩個成員函式并沒有 `const` 限定，因此還是會編譯報錯。因此，`getReal` 和 `getImag` 也是要宣告為有 `const` 限定的成員函式。

此外就是複製建構函式的問題。由於類似的原因，絕大多數複製建構函式的參數都是對帶有 `const` 限定的類型的參考。

**未完待續……**

## 什麽時候該加 `const`？

如果一個成員函式不會改變類別内的成員，那麽請毫不猶豫地加上 `const`；如果一個以指標或參考傳遞的函式參數不會改變其參考或指向的物件，那麽也請毫不猶豫地加上 `const`。

**未完待續……**

## 常數運算式

**什麽時候該加……（繼續鴿 x）**

## 單一定義規則（ODR）与 odr-used

**……**

