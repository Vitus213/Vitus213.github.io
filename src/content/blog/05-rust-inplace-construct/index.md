---
title: "In-Place Construction in Rust"
description: "A deep dive into in-place construction techniques in Rust"
date: "Aug 07 2025"
---

> Try it with Godbolt: https://rust.godbolt.org/z/sr1e3P9jx

## Intro

In kernel development, we meet a limited stack that requires us to use as little stack space as possible. In C++, we can easily perform in-place construction using placement new, but due to Rust's strict ownership and borrowing rules, we need to use unsafe code to achieve the same effect.

For example, for a struct like this:

```rust
#[repr(C)]
pub struct Complex {
    pub big_member: [i32; 160],
}
```

Most of the time, if we want to allocate it on heap, we just simply:

```rust
let complex = Box::new(Complex {
    big_member: [0; 160],
});
```

However, the actual behavior, according to [`Box::new`](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.new), it first allocates the memory **on the heap**, and then "places x into it". Seems good so far, but where is the `x` being constructed? It is actually constructed **on the stack**, which in this case will cause a giant `[i32; 160]` array to be allocated on the stack, which may cause stack overflow.

## Impl

To avoid this, we can use pattern like this:

```rust
use std::mem::MaybeUninit;
use std::ptr;

let mut val: Box<MaybeUninit<Complex>> = Box::<Complex>::new_uninit();
let raw: *mut Complex = val.as_mut_ptr();
let val: Box<Complex> = unsafe {
    // 1. Get a raw pointer to the specific field *within* the heap allocation.
    // `addr_of_mut!` is crucial as it doesn't create a temporary reference.
    let big_member_ptr: *mut [i32; 160] = ptr::addr_of_mut!((*raw).big_member);

    // 2. Initialize that field directly. Here, we can use `write_bytes`
    // on the field itself.
    ptr::write_bytes(big_member_ptr, 0u8, 1);
    val.assume_init()
};
// you are now be able to use `val` here.
```

Let's explore the [`Box::new_uninit`](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.new_uninit). It actually wraps the [`Box::try_new_uninit_in`](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.try_new_uninit_in) method, where we do not initialize any value, but directly allocate a piece of memory (which is wrap with `MaybeUninit`) on the heap. The `MaybeUninit` type gives `Box` a hint to allocate memory with a specific layout, but ignores the initialization of the value, just like `malloc` in C.

```rust
pub fn try_new_uninit_in(alloc: A) -> Result<Box<mem::MaybeUninit<T>, A>, AllocError>
where
    A: Allocator,
{
    let ptr = if T::IS_ZST {
        NonNull::dangling()
    } else {
        let layout = Layout::new::<mem::MaybeUninit<T>>();
        alloc.allocate(layout)?.cast()
    };
    unsafe { Ok(Box::from_raw_in(ptr.as_ptr(), alloc)) }
}
```

Then we can construct the value in-place manually, just like in C. To achieve this, we need to use Rust specific APIs like [`ptr::addr_of_mut!`](https://doc.rust-lang.org/std/ptr/macro.addr_of_mut.html) to get a raw pointer to the field we want to initialize, and then, in this field, since we have one simple `[i32; 160]` and all zero is acceptable content in it, we use [`ptr::write_bytes`](https://doc.rust-lang.org/std/ptr/fn.write_bytes.html) to write zeros directly into that memory location.

Now in this case, since we have a struct that with single `[i32; 160]` field, and having the same layout with C (We mark `#[repr(C)]` there), we can actually simply initialize the whole struct with zeros, like this:

```rust
#![feature(new_zeroed_alloc)]
let zero: Box<MaybeUninit<Complex>> = Box::<Complex>::new_zeroed();
let val: Box<Complex> = unsafe { zero.assume_init() };
```

That saves a lot of code. [`Box::new_zeroed`](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.new_zeroed) allows us to allocate a zeroed memory on the heap, and then we can use [`assume_init`](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html#method.assume_init) to convert it into a `Box<Complex>`.

## More

*[Allocating array on heap using Box::new([;]) results in stack overflow](https://users.rust-lang.org/t/allocating-array-on-heap-using-box-new-results-in-stack-overflow/129264/6)*

This answer basically demonstrates there is no such magic that can guarantee the item with `Box::new` is directly allocated and initialized on the heap, and gives a way to construct the array in-place using `vec` APIs.
