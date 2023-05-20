import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { updateHandposeHistory } from "../lib/updateHandposeHistory";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { isFront } from "../lib/calculator/isFront";
import { Monitor } from "./Monitor";
import { convert3DKeypointsToHandpose } from "../lib/converter/convert3DKeypointsToHandpose";
import { resizeHandpose } from "../lib/converter/resizeHandpose";
import { getFingerTips } from "../lib/getFingerTips";
import { giftwrap } from "../lib/calculator/giftwrap";

type Props = {
  handpose: MutableRefObject<Hand[]>;
};

let leftHand: Keypoint[] = [];
let rightHand: Keypoint[] = [];
let rightHand2D: Keypoint[] = [];
let leftHandOpacity: number = 0;
let rightHandOpacity: number = 0;
const minimumFrame: number = 12;
const rightHandposes: Keypoint[][][] = [[]];
const rightHandposesHead: number[] = [0];

type Handpose = Keypoint[];

const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose }: Props) => {
  let handposeHistory: {
    left: Handpose[];
    right: Handpose[];
  } = { left: [], right: [] };
  let handposeHistory2D: {
    left: Handpose[];
    right: Handpose[];
  } = { left: [], right: [] };

  const debugLog = useRef<{ label: string; value: any }[]>([]);

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(2);
  };

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convert3DKeypointsToHandpose(handpose.current);
    const raw2DHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current);
    handposeHistory = updateHandposeHistory(rawHands, handposeHistory); //handposeHistoryの更新
    handposeHistory2D = updateHandposeHistory(raw2DHands, handposeHistory2D); //handposeHistoryの更新
    const hands: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(rawHands, handposeHistory); //平滑化された手指の動きを取得する
    const hands2D: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(raw2DHands, handposeHistory2D); //平滑化された手指の動きを取得する

    // logとしてmonitorに表示する
    debugLog.current = [];
    for (const hand of handpose.current) {
      debugLog.current.push({
        label: hand.handedness + " accuracy",
        value: hand.score,
      });
      debugLog.current.push({
        label: hand.handedness + " is front",
        //@ts-ignore
        value: isFront(hand.keypoints, hand.handedness.toLowerCase()),
      });
    }

    debugLog.current.push({
      label: "rightHandposes length",
      value: rightHandposes.length,
    });

    p5.clear();
    if (hands.left.length > 0) {
      leftHand = hands.left;
      leftHandOpacity = Math.min(255, leftHandOpacity + 255 / 10);
    } else {
      leftHandOpacity = Math.max(0, leftHandOpacity - 255 / 10);
    }

    const keypointsArray: Keypoint[] = [];

    if (hands.right.length > 0) {
      rightHand = hands.right;
      rightHand2D = hands2D.right;
      rightHandOpacity = Math.min(255, rightHandOpacity + 255 / 10);
    } else {
      rightHandOpacity = Math.max(0, rightHandOpacity - 255 / 10);
      rightHandposes[rightHandposes.length - 1] = [];
    }

    if (rightHand.length > 0) {
      const fingerTips = getFingerTips(resizeHandpose(rightHand, 1500));
      if (isFront(rightHand2D, "right")) {
        rightHandposes[rightHandposes.length - 1].push(fingerTips);
        keypointsArray.push(...fingerTips);
      } else if (rightHandposes[rightHandposes.length - 1].length > 0) {
        rightHandposes.push([]);
        rightHandposesHead.push(0);
      }

      if (!isFront(rightHand2D, "right")) {
        p5.push();
        p5.stroke(255, rightHandOpacity);
        p5.noFill();
        p5.translate(p5.width / 2, p5.height / 2);
        const indices = giftwrap(rightHand2D);
        p5.beginShape();
        for (const index of indices) {
          p5.vertex(rightHand2D[index].x, rightHand2D[index].y);
        }
        p5.endShape(p5.CLOSE);
        p5.pop();
      }

      if (rightHandposes.length > 1) {
        //ログモーションの描画
        rightHandposes.forEach((hands, i) => {
          if (hands.length > minimumFrame && i < rightHandposes.length - 1) {
            keypointsArray.push(...hands[rightHandposesHead[i]]);
            rightHandposesHead[i] = (rightHandposesHead[i] + 1) % hands.length;
          }
        });
      }

      p5.push();
      p5.noStroke();
      p5.translate(p5.width / 2, p5.height / 2 + 50);
      const indices = giftwrap(keypointsArray);
      p5.beginShape();
      for (const index of indices) {
        p5.vertex(keypointsArray[index].x, keypointsArray[index].y);
      }
      p5.endShape(p5.CLOSE);
      p5.pop();
    }
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <Monitor handpose={handpose} debugLog={debugLog} />
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
