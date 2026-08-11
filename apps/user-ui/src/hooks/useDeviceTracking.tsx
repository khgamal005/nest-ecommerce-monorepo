'use client';

import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";

const useDeviceTracking = () => {
  const [deviceInfo, setDeviceInfo] = useState("");

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    const info = `${result.device.type || "desktop"} - ${result.os.name} ${result.os.version} - ${result.browser.name} ${result.browser.version}`;

    // Set state
    setDeviceInfo(info);

    // Save correct data to localStorage
    // localStorage.setItem(
    //   "deviceInfo",
    //   JSON.stringify({
    //     deviceInfo: info,
    //     timestamp: Date.now()
    //   })
    // );
  }, []);

  return deviceInfo;
};

export default useDeviceTracking;
