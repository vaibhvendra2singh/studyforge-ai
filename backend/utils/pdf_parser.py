"""
PDF text extraction utility using PyMuPDF (fitz)
"""

import io


def extract_text_from_pdf(file_bytes: bytes, max_chars: int = 14000) -> str:
    """
    Extract readable text content from a PDF file.
    If the document is multi-page (e.g. lecture slides or notes),
    intelligently balances extraction across ALL pages so the entire document
    is represented without exceeding LLM prompt budgets or token rate limits.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = []
        for i in range(len(doc)):
            t = doc[i].get_text("text").strip()
            if t:
                pages_text.append((i + 1, t))
        doc.close()

        if not pages_text:
            raise ValueError("No readable text found in PDF. The PDF may be image-based or encrypted.")

        full_raw = "\n\n".join([f"[Page {p}]\n{t}" for p, t in pages_text])
        if len(full_raw) <= max_chars:
            return full_raw

        # Distribute character budget across every page so all topics are covered
        budget_per_page = max(350, max_chars // len(pages_text))
        balanced_parts = []
        for p, t in pages_text:
            lines = [line.strip() for line in t.splitlines() if line.strip()]
            page_sample = " ".join(lines)[:budget_per_page]
            balanced_parts.append(f"[Page {p}]\n{page_sample}")

        return "\n\n".join(balanced_parts)
    except ImportError:
        raise ValueError("PyMuPDF (fitz) is not installed. Run: pip install pymupdf")
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {str(e)}")
