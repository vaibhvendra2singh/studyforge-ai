"""
PDF text extraction utility using PyMuPDF (fitz)
"""

import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text content from a PDF file given its raw bytes.
    Returns extracted text string or raises ValueError if extraction fails.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            if text.strip():
                text_parts.append(f"[Page {page_num + 1}]\n{text}")
        doc.close()
        full_text = "\n\n".join(text_parts)
        if not full_text.strip():
            raise ValueError("No readable text found in PDF. The PDF may be image-based or encrypted.")
        return full_text
    except ImportError:
        raise ValueError("PyMuPDF (fitz) is not installed. Run: pip install pymupdf")
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {str(e)}")
