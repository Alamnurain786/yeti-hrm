import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for touch gesture detection (swipe left/right)
 * @param {function} onSwipeLeft - Callback for left swipe
 * @param {function} onSwipeRight - Callback for right swipe
 * @param {number} threshold - Minimum distance for swipe detection (default: 50px)
 * @returns {object} Touch event handlers
 */
export const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const minSwipeDistance = threshold;

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

/**
 * Custom hook to detect mobile device
 * @returns {object} Device detection info
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenWidth,
  };
};

/**
 * Custom hook for mobile-optimized validation
 * Shows validation differently on mobile (toast instead of inline)
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {object} Validation display helpers
 */
export const useMobileValidation = (isMobile) => {
  const [showMobileErrors, setShowMobileErrors] = useState(false);
  const [mobileErrorList, setMobileErrorList] = useState([]);

  const displayMobileErrors = useCallback(
    (errors) => {
      if (!isMobile) return;

      const errorArray = Object.entries(errors).map(([field, message]) => ({
        field,
        message,
      }));

      setMobileErrorList(errorArray);
      setShowMobileErrors(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowMobileErrors(false);
      }, 5000);
    },
    [isMobile]
  );

  const hideMobileErrors = useCallback(() => {
    setShowMobileErrors(false);
    setMobileErrorList([]);
  }, []);

  return {
    showMobileErrors,
    mobileErrorList,
    displayMobileErrors,
    hideMobileErrors,
  };
};

/**
 * Custom hook for mobile file picker with better UX
 * @returns {object} File picker helpers
 */
export const useMobileFilePicker = () => {
  const fileInputRef = useRef(null);

  const openFilePicker = useCallback((accept = "*") => {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.style.display = "none";
      fileInputRef.current = input;
      document.body.appendChild(input);
    }

    fileInputRef.current.accept = accept;
    return new Promise((resolve) => {
      fileInputRef.current.onchange = (e) => {
        const file = e.target.files?.[0];
        resolve(file);
      };
      fileInputRef.current.click();
    });
  }, []);

  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  return {
    openFilePicker,
  };
};
