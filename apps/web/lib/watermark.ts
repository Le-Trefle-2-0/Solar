import {degrees, PDFDocument, rgb, StandardFonts} from 'pdf-lib';
import {addYears, format} from 'date-fns';
import {fr} from 'date-fns/locale';

/**
 * Applies a watermark to an image file.
 */
export async function watermarkImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;

                // Draw original image
                ctx.drawImage(img, 0, 0);

                const expiryDate = format(addYears(new Date(), 1), 'dd/MM/yyyy', {locale: fr});
                const text = `Le Trèfle 2.0 - Expire le ${expiryDate}`;

                // Watermark settings
                const fontSize = Math.max(canvas.width, canvas.height) / 40;
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const colors = [
                    'rgba(200, 50, 50, 0.3)',   // Muted Red
                    'rgba(50, 200, 50, 0.3)',   // Muted Green
                    'rgba(50, 50, 200, 0.3)',   // Muted Blue
                    'rgba(150, 150, 150, 0.3)', // Grey
                ];

                // Tile the watermark
                const stepX = fontSize * 10;
                const stepY = fontSize * 4;
                const angle = -Math.PI / 6;

                for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                    for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(angle);
                        
                        // Select color based on position
                        const colorIndex = (Math.abs(Math.floor(x / stepX)) + Math.abs(Math.floor(y / stepY))) % colors.length;
                        ctx.fillStyle = colors[colorIndex];
                        
                        ctx.fillText(text, 0, 0);
                        ctx.restore();
                    }
                }

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, {type: file.type}));
                    } else {
                        reject(new Error('Canvas to Blob failed'));
                    }
                }, file.type);
            };
            img.onerror = () => reject(new Error('Image loading failed'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
    });
}

/**
 * Applies a watermark to a PDF file.
 */
export async function watermarkPDF(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const expiryDate = format(addYears(new Date(), 1), 'dd/MM/yyyy', {locale: fr});
    const text = `Le Trefle 2.0 - Expire le ${expiryDate}`;

    for (const page of pages) {
        const {width, height} = page.getSize();
        const fontSize = 15;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        
        const colors = [
            rgb(0.8, 0.2, 0.2), // Muted Red
            rgb(0.2, 0.8, 0.2), // Muted Green
            rgb(0.2, 0.2, 0.8), // Muted Blue
            rgb(0.6, 0.6, 0.6), // Grey
        ];

        const stepX = textWidth * 1.5;
        const stepY = fontSize * 6;
        const rotationAngle = 30;

        for (let y = -height; y < height * 2; y += stepY) {
            for (let x = -width; x < width * 2; x += stepX) {
                const colorIndex = (Math.abs(Math.floor(x / stepX)) + Math.abs(Math.floor(y / stepY))) % colors.length;
                
                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font: helveticaFont,
                    color: colors[colorIndex],
                    opacity: 0.25,
                    rotate: degrees(rotationAngle),
                });
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new File([pdfBytes], file.name, {type: 'application/pdf'});
}

/**
 * Main function to watermark documents (images or PDFs).
 */
export async function watermarkDocument(file: File): Promise<File> {
    if (file.type.startsWith('image/')) {
        return watermarkImage(file);
    } else if (file.type === 'application/pdf') {
        return watermarkPDF(file);
    }
    // Return original file if type not supported for watermarking
    return file;
}
