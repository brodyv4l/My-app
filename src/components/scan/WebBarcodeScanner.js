import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createPortal } from 'react-dom';
import { getOffProductByBarcode, normalizeScannedBarcode } from '../../services/food/providers/openFoodFacts';

const ACCENT = '#AAFF00';

function loadZXingBrowser() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Web only'));
  if (window.ZXingBrowser?.BrowserMultiFormatReader) {
    return Promise.resolve(window.ZXingBrowser);
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-zxing-browser]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.ZXingBrowser));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js';
    script.async = true;
    script.dataset.zxingBrowser = 'true';
    script.onload = () => resolve(window.ZXingBrowser);
    script.onerror = () => reject(new Error('Failed to load barcode scanner library'));
    document.head.appendChild(script);
  });
}

function resolveHostNode(ref) {
  if (!ref) return null;
  if (ref instanceof HTMLElement) return ref;
  if (typeof ref === 'object' && ref.nodeType === 1) return ref;
  return null;
}

function stopStream(videoEl) {
  const stream = videoEl?.srcObject;
  if (stream?.getTracks) stream.getTracks().forEach((t) => t.stop());
  if (videoEl) videoEl.srcObject = null;
}

export default function WebBarcodeScanner({ onProductFound, onNotFound, onClose, onSearchManual }) {
  const scannedRef = useRef(false);
  const videoRef = useRef(null);
  const hostRef = useRef(null);
  const controlsRef = useRef(null);
  const callbacksRef = useRef({ onProductFound, onNotFound });
  const [hostEl, setHostEl] = useState(null);
  const [error, setError] = useState(null);
  const [looking, setLooking] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  callbacksRef.current = { onProductFound, onNotFound };

  const setHostRef = useCallback((node) => {
    const el = resolveHostNode(node);
    hostRef.current = el;
    setHostEl(el);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !hostEl) return undefined;

    let mounted = true;
    scannedRef.current = false;

    const stopScanner = () => {
      controlsRef.current?.stop?.();
      controlsRef.current = null;
      stopStream(videoRef.current);
    };

    const handleBarcode = async (code) => {
      const trimmed = normalizeScannedBarcode(code);
      if (scannedRef.current || !trimmed || trimmed.length < 8) return;
      scannedRef.current = true;
      setLooking(true);
      stopScanner();
      try {
        const product = await getOffProductByBarcode(trimmed);
        if (product) callbacksRef.current.onProductFound?.(product);
        else callbacksRef.current.onNotFound?.(trimmed);
      } catch {
        callbacksRef.current.onNotFound?.(trimmed);
      } finally {
        setLooking(false);
      }
    };

    const waitForVideo = () => new Promise((resolve, reject) => {
      let tries = 0;
      const tick = () => {
        if (!mounted) return;
        if (videoRef.current) {
          resolve(videoRef.current);
          return;
        }
        tries += 1;
        if (tries > 60) {
          reject(new Error('Camera view not ready'));
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });

    const startBarcodeDetector = async (video) => {
      if (typeof window.BarcodeDetector !== 'function') return null;
      try {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        });
        let running = true;
        const loop = async () => {
          while (running && mounted && !scannedRef.current) {
            try {
              const codes = await detector.detect(video);
              if (codes?.length) {
                await handleBarcode(codes[0].rawValue);
                running = false;
                return;
              }
            } catch {
              // ignore frame misses
            }
            await new Promise((r) => requestAnimationFrame(r));
          }
        };
        loop();
        return { stop: () => { running = false; } };
      } catch {
        return null;
      }
    };

    const startZxing = async (video) => {
      const ZXingBrowser = await loadZXingBrowser();
      const { BrowserMultiFormatReader } = ZXingBrowser;
      const codeReader = new BrowserMultiFormatReader(undefined, 300);
      return codeReader.decodeFromVideoElement(video, (result, err) => {
        if (result && !scannedRef.current) {
          handleBarcode(result.getText());
        }
        if (err && !String(err?.message || err).includes('NotFoundException')) {
          // ignore routine scan misses
        }
      });
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera is not supported in this browser. Try Safari or Chrome.');
        }

        const video = await waitForVideo();
        if (!mounted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        await video.play().catch(() => {});

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setCameraReady(true);

        const nativeControls = await startBarcodeDetector(video);
        const controls = nativeControls || await startZxing(video);
        if (!mounted) {
          controls?.stop?.();
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        controlsRef.current = controls;
      } catch (e) {
        if (!mounted) return;
        const msg = e?.message || '';
        setError(
          msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')
            ? 'Camera access denied. Allow camera for this site in your browser settings, then try again.'
            : (msg || 'Could not start camera. Please try again.'),
        );
      }
    };

    start();

    return () => {
      mounted = false;
      stopScanner();
      setCameraReady(false);
    };
  }, [hostEl]);

  if (error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSearchManual}>
          <Text style={styles.link}>Search Manually Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View ref={setHostRef} collapsable={false} style={styles.videoHost} />
      {hostEl && createPortal(
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
          }}
        />,
        hostEl,
      )}

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.dimTop} />
        <View style={styles.midRow}>
          <View style={styles.dimSide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom}>
          <Text style={styles.hint}>
            {looking
              ? 'Found! Looking up product...'
              : cameraReady
                ? 'Align the barcode inside the box'
                : 'Starting camera… allow access when prompted'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.close} onPress={onClose}>
        <Text style={styles.closeText}>✕ Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  videoHost: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  dimTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  midRow: { flexDirection: 'row', height: 260 },
  dimSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  frame: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: ACCENT },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  dimBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', paddingTop: 24 },
  hint: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 16 },
  close: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20, zIndex: 10 },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorWrap: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#fff', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  primaryBtn: { backgroundColor: ACCENT, padding: 14, borderRadius: 10, marginBottom: 12 },
  primaryBtnText: { color: '#000', fontWeight: '700' },
  link: { color: ACCENT, fontWeight: '600' },
});
