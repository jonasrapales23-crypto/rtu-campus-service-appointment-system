from PIL import Image, ImageDraw, ImageFont

font = ImageFont.load_default(size=30)


def make(path, lines):
    img = Image.new("RGB", (1200, 80, 60 * len(lines)), "white")
    d = ImageDraw.Draw(img)
    y = 40
    for line in lines:
        d.text((40, y), line, fill="black", font=font)
        y += 60
    img.save(path)

make("sample_id.png", [
    "REPUBLIC OF THE PHILIPPINES",
    "UNIFIED MULTI-PURPOSE ID",
    "CRN: 0000-0000000-0",
    "SURNAME: BALABAT",
    "GIVEN NAME: NICOLE",
    "MIDDLE NAME: LUMAYAM",
    "DATE OF BIRTH: 07/19/2005",
])
make("sample_letter.png", [
    "AUTHORIZATION LETTER",
    "I, Nicole Lumayam, hereby authorize",
    "the bearer of this letter to act on my behalf",
    "my transcript of records.",
    "Thank you.",
    "Nicole Lumayam Balabat",
])