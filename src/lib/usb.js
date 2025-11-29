export async function requestUsbDevice(filters = []) {
  const device = await navigator.usb.requestDevice({ filters });
  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);
  await device.claimInterface(0);
  return device;
}

export async function usbTransferIn(device, endpoint = 1) {
  const result = await device.transferIn(endpoint, 64);
  return new TextDecoder().decode(result.data);
}

export async function usbTransferOut(device, endpoint = 2, data) {
  return device.transferOut(endpoint, new TextEncoder().encode(data));
}
