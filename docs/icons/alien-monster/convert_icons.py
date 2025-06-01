from PIL import Image
import os

# Theme color in RGB (from hex #CC66FF)
THEME_R = 204  # 0xcc
THEME_G = 102  # 0x66
THEME_B = 255  # 0xff


def process_image(image):
    # Convert to RGBA if not already
    if image.mode != "RGBA":
        image = image.convert("RGBA")

    # Get image data
    data = image.getdata()

    # Create new image with same size and mode
    new_image = Image.new("RGBA", image.size)
    new_data = []

    for item in data:
        # Preserve transparency
        if item[3] == 0:
            new_data.append((0, 0, 0, 0))
            continue

        # If pixel is not white or black (has some color)
        if max(item[0:3]) - min(item[0:3]) > 10:  # Check if the pixel has some color
            # Simply use the theme color
            new_data.append((THEME_R, THEME_G, THEME_B, item[3]))
        else:
            # Keep grayscale pixels as is
            new_data.append(item)

    new_image.putdata(new_data)
    return new_image


def main():
    # Create output directory
    output_dir = "themed_icons"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Process all PNG and ICO files
    for filename in os.listdir("."):
        if filename.lower().endswith((".png", ".ico")):
            try:
                with Image.open(filename) as img:
                    print(f"Processing {filename}...")
                    new_img = process_image(img)

                    # Save with same format as original
                    output_path = os.path.join(output_dir, filename)
                    new_img.save(output_path, format=img.format)
                    print(f"Saved {output_path}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")


if __name__ == "__main__":
    main()
