/**
 * Client-side ZIP archive unpacker using native browser Web APIs.
 * Supports Store (method 0) and Deflate (method 8 via DecompressionStream).
 */

export interface ExtractedFile {
  name: string;
  size: number;
  data: Uint8Array;
  text: string;
}

export async function parseZipArchive(buffer: ArrayBuffer): Promise<ExtractedFile[]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const files: ExtractedFile[] = [];

  let offset = 0;
  const len = bytes.length;

  while (offset + 30 <= len) {
    // Check local file header signature: PK\x03\x04
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) {
      break;
    }

    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
    const filename = new TextDecoder("utf-8").decode(nameBytes);

    const dataStart = offset + 30 + nameLen + extraLen;

    const hasDataDescriptor = (flags & 0x08) !== 0;
    let compLen = compressedSize;
    const uncompLen = uncompressedSize;

    if (hasDataDescriptor && compLen === 0) {
      let nextHeader = dataStart;
      while (nextHeader + 4 <= len) {
        const nextSig = view.getUint32(nextHeader, true);
        if (nextSig === 0x04034b50 || nextSig === 0x02014b50 || nextSig === 0x08074b50) {
          break;
        }
        nextHeader++;
      }
      compLen = nextHeader - dataStart;
    }

    if (!filename.endsWith("/") && !filename.includes("__MACOSX") && !filename.startsWith(".")) {
      const compressedData = bytes.subarray(dataStart, dataStart + compLen);

      let decompressedBytes: Uint8Array | null = null;

      if (method === 0) {
        decompressedBytes = compressedData;
      } else if (method === 8) {
        try {
          if (typeof DecompressionStream !== "undefined") {
            const ds = new DecompressionStream("deflate-raw");
            const writer = ds.writable.getWriter();
            writer.write(compressedData);
            writer.close();
            const response = new Response(ds.readable);
            const decompressedBuf = await response.arrayBuffer();
            decompressedBytes = new Uint8Array(decompressedBuf);
          }
        } catch {
          decompressedBytes = compressedData;
        }
      }

      if (decompressedBytes) {
        let textContent = "";
        try {
          textContent = new TextDecoder("utf-8", { fatal: false }).decode(decompressedBytes);
        } catch {
          textContent = "";
        }

        files.push({
          name: filename.replace(/\\/g, "/"),
          size: uncompLen || decompressedBytes.length,
          data: decompressedBytes,
          text: textContent,
        });
      }
    }

    offset = dataStart + compLen;
    if (hasDataDescriptor && offset + 4 <= len && view.getUint32(offset, true) === 0x08074b50) {
      offset += 16;
    }
  }

  return files;
}
