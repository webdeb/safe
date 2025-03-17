import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Textarea, Input, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import JSZip from 'jszip';

export default function Decrypt() {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicKey, setPublicKey] = useState('');
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const generateKeyPair = async () => {
    try {
      setIsLoading(true);
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
      );
      
      setPrivateKey(keyPair.privateKey);
      const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
      setPublicKey(publicKeyBase64);
      
      // Automatically download the private key
      const privateKeyExport = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyExport)));
      const blob = new Blob([privateKeyBase64], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "private_key.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess("Key pair generated successfully. Private key has been downloaded.");
    } catch (error) {
      showError("Failed to generate key pair: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPublicKey = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey);
        showSuccess("Public key copied to clipboard");
      } catch (error) {
        showError("Failed to copy public key: " + (error as Error).message);
      }
    } else {
      showError("No public key available to copy");
    }
  };

  const importPrivateKey = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      showError("Please select a private key file");
      return;
    }

    try {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async function (event) {
        try {
          const importedKey = await window.crypto.subtle.importKey(
            "pkcs8",
            Uint8Array.from(atob(event.target?.result as string), c => c.charCodeAt(0)),
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
          );
          setPrivateKey(importedKey);
          showSuccess("Private key imported successfully");
        } catch (error) {
          showError("Failed to import private key: " + (error as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      showError("Failed to read private key file: " + (error as Error).message);
      setIsLoading(false);
    }
  };

  const decryptData = async () => {
    if (!encryptedFile) {
      showError("Please select an encrypted file");
      return;
    }
    if (!privateKey) {
      showError("Please import your private key first");
      return;
    }

    try {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async function (event) {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const encryptedAesKey = buffer.slice(0, 256);
          const iv = new Uint8Array(buffer.slice(256, 268));
          const encryptedData = buffer.slice(268);
          
          const aesKeyRaw = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedAesKey
          );
          const aesKey = await window.crypto.subtle.importKey(
            "raw",
            aesKeyRaw,
            { name: "AES-GCM" },
            true,
            ["decrypt"]
          );
          
          const decryptedData = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            encryptedData
          );
          
          const zip = new JSZip();
          const unzippedFiles = await zip.loadAsync(decryptedData);
          for (let fileName in unzippedFiles.files) {
            const fileData = await unzippedFiles.files[fileName].async("blob");
            const link = document.createElement("a");
            link.href = URL.createObjectURL(fileData);
            link.download = fileName;
            link.innerText = `Download ${fileName}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
          }
          showSuccess("Files decrypted successfully");
        } catch (error) {
          showError("Failed to decrypt files: " + (error as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(encryptedFile);
    } catch (error) {
      showError("Failed to read encrypted file: " + (error as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">Decrypt Files</p>
          <p className="text-small text-default-500">Import your private key and select the encrypted file to decrypt.</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div>
            <Button
              color="primary"
              onClick={generateKeyPair}
              isLoading={isLoading}
              className="w-full"
            >
              Generate New Key Pair
            </Button>
          </div>
          <div>
            <Textarea
              label="Your Public Key"
              placeholder="Your public key will appear here after generation"
              value={publicKey}
              readOnly
              className="w-full"
            />
            <Button
              color="secondary"
              variant="flat"
              onClick={copyPublicKey}
              className="mt-2 w-full"
            >
              Copy Public Key
            </Button>
          </div>
          <div>
            <Input
              type="file"
              label="Import Private Key"
              onChange={importPrivateKey}
              accept=".json"
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="file"
              label="Select Encrypted File"
              onChange={(e) => setEncryptedFile(e.target.files?.[0] || null)}
              accept=".enc"
              className="w-full"
            />
          </div>
          <div>
            <Button
              color="primary"
              onClick={decryptData}
              isLoading={isLoading}
              className="w-full"
            >
              Decrypt Files
            </Button>
          </div>
        </div>
      </CardBody>

      {/* Error Modal */}
      <Modal isOpen={!!error} onClose={() => setError('')}>
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalBody>{error}</ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setError('')}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={!!success} onClose={() => setSuccess('')}>
        <ModalContent>
          <ModalHeader>Success</ModalHeader>
          <ModalBody>{success}</ModalBody>
          <ModalFooter>
            <Button color="primary" variant="light" onPress={() => setSuccess('')}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
} 
