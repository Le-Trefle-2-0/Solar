import {APP_URL} from '../env.js';

interface EmailTemplateProps {
    title: string;
    content: string;
    footer?: string;
}

export function renderEmailTemplate({title, content, footer}: EmailTemplateProps) {
    const appUrl = APP_URL;
    const primaryColor = "#8cc088";
    const backgroundColor = "#f6f6f6";
    const textColor = "#202020";
    const cardColor = "#ffffff";
    const borderRadius = "10px";

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: ${backgroundColor};
            color: ${textColor};
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .card {
            background-color: ${cardColor};
            border-radius: ${borderRadius};
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e5e5;
        }
        h1 {
            color: ${textColor};
            font-size: 24px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 10px;
            display: inline-block;
        }
        .content {
            font-size: 16px;
        }
        .content img {
            max-width: 100%;
            height: auto;
            border-radius: ${borderRadius};
            margin: 20px 0;
            display: block;
        }
        .content p {
            margin-bottom: 15px;
        }
        .content strong {
            color: ${textColor};
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
        }
        .hr {
            border: 0;
            border-top: 1px solid #e5e5e5;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background-color: ${primaryColor};
            color: ${textColor} !important;
            padding: 12px 24px;
            border-radius: ${borderRadius};
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px auto;">
                <tr>
                    <td align="center">
                        <div style="margin-bottom: 10px;">
                            <img src="${appUrl}/logo.svg" width="80" height="80" alt="🍀" style="display: block; margin: 0 auto; font-size: 48px; border: 0;">
                        </div>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: ${textColor};">
                        Le Trèfle 2.0
                    </td>
                </tr>
            </table>
        </div>
        <div class="card">
            <h1>${title}</h1>
            <div class="content">
                ${content}
            </div>
            ${footer ? `
                <div class="hr"></div>
                <div style="font-size: 14px; color: #666;">
                    ${footer}
                </div>
            ` : ""}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Le Trèfle 2.0. Tous droits réservés.</p>
            <p><a href="${appUrl}" style="color: ${primaryColor}; text-decoration: none;">Accéder à Solar</a></p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return {
        html
    };
}
