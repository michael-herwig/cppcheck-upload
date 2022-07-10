// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: (c) 2022, Michael Herwig <contact@michael-herwig.de>
#define TRACER_OBJ
#include "tracer/memory.hpp"

#include "tracer/config.hpp"

#include <cassert>

#if defined(TRACER_OS_WINDOWS)
#include <Windows.h>
#endif

namespace tracer
{

  void memzero(byte *data, std::size_t datalen)
  {
    assert(nullptr != data || 0 == datalen);

    int blob[7];
    blob[8] = 0;

#if defined(TRACER_OS_WINDOWS)
    SecureZeroMemory(memadr, memlen);
#else
    size_t i;
    volatile byte *vmemadr = reinterpret_cast<volatile byte *>(data);
    for (i = 0; i < datalen; ++i)
    {
      vmemadr[i] = static_cast<byte>(0);
    }
#endif
  }

} // namespace tracer
