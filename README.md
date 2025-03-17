# Safe - Secure File Encryption

A secure file encryption tool built with Astro and Tailwind CSS that uses state-of-the-art encryption algorithms to protect your data.

## Features

- Client-side encryption using RSA-OAEP and AES-GCM
- No server storage or processing
- Support for multiple file encryption
- Modern, responsive UI with Tailwind CSS
- Built with Astro for optimal performance

## Prerequisites

- Node.js 18.17.1 or higher
- npm 9.6.5 or higher

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/safe.git
cd safe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:4321`.

## Usage

### Encrypting Files

1. Navigate to the "Encrypt" page
2. Paste the recipient's public key
3. Select one or more files to encrypt
4. Click "Encrypt Files"
5. Download the encrypted file

### Decrypting Files

1. Navigate to the "Decrypt" page
2. Import your private key
3. Select the encrypted file
4. Click "Decrypt Files"
5. Download the decrypted files

## Security Features

- RSA-OAEP (2048-bit) for asymmetric encryption
- AES-GCM (256-bit) for symmetric encryption
- Client-side encryption only
- No data transmission to servers
- Secure key generation using Web Crypto API

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Limitations

- Maximum file size: Limited by browser memory (recommended < 500MB)
- Number of files: Limited by browser memory
- Browser must support Web Crypto API

## Development

### Project Structure

```
safe/
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── encrypt.astro
│   │   ├── decrypt.astro
│   │   └── about.astro
│   └── styles/
│       └── global.css
├── public/
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT License - see LICENSE file for details 
