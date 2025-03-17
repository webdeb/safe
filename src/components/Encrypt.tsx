import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Textarea, Input, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import JSZip from 'jszip';

export default function Encrypt() {
  const [publicKey, setPublicKey] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
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

  const encryptData = async () => {
    if (!publicKey.trim()) {
      showError('Please paste the recipient\'s public key');
      return;
    }
    if (!files || files.length === 0) {
      showError('Please select files to encrypt');
      return;
    }

    try {
      setIsLoading(true);
      const publicKeyBuf = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0));
      const importedPublicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuf,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );

      const zip = new JSZip();
      for (let file of files) {
        zip.file(file.name, file);
      }

      const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const aesKeyRaw = await window.crypto.subtle.exportKey("raw", aesKey);
      const encryptedAesKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        importedPublicKey,
        aesKeyRaw
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        zipBlob
      );

      const blob = new Blob([encryptedAesKey, iv, encryptedData], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "encrypted.enc";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Files encrypted successfully');
    } catch (error) {
      showError('Encryption failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">Encrypt Files</p>
          <p className="text-small text-default-500">Select files and paste the recipient's public key to encrypt.</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div>
            <Textarea
              label="Recipient's Public Key"
              placeholder="Paste the recipient's public key here"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="file"
              label="Select Files"
              onChange={(e) => setFiles(e.target.files)}
              multiple
              className="w-full"
            />
          </div>
          <div>
            <Button
              color="primary"
              onClick={encryptData}
              isLoading={isLoading}
              className="w-full"
            >
              Encrypt Files
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
