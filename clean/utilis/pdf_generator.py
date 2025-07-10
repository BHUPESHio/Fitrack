from fpdf import FPDF
import uuid
import os

def generate_pdf(title, content):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.multi_cell(0, 10, f"Title: {title}\n\n")
    pdf.multi_cell(0, 10, content)

    filename = f"{uuid.uuid4()}.pdf"
    output_dir = "static/pdfs"
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, filename)
    pdf.output(path)

    return filename
