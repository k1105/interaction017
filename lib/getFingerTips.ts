import { Keypoint } from "@tensorflow-models/hand-pose-detection";

type Handpose = Keypoint[];

export const getFingerTips = (handpose: Handpose) => {
  return [handpose[4], handpose[8], handpose[12], handpose[16], handpose[20]];
};
