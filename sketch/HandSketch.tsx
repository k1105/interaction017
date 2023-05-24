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

let rightHand: Keypoint[] = [];
let rightHand2D: Keypoint[] = [];
let rightHandOpacity: number = 0;
const minimumFrame: number = 12;
const rightHandVelocities: Keypoint[][][] = [[]];
const rightHandposesHead: number[] = [0]; // velocityの先頭を管理
const rightHandPositions: Keypoint[][] = []; //現在のフレームにおける位置を管理
let prevRightHandPosition: Keypoint[] = []; //1フレーム前の手指の動きを保存

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
      label: "rightHandVelocities length",
      value: rightHandVelocities.length,
    });

    debugLog.current.push({
      label: "RightHandPositions length",
      value: rightHandPositions.length,
    });

    p5.clear();

    const keypointsArray: Keypoint[] = [];

    if (hands.right.length > 0) {
      rightHand = hands.right;
      rightHand2D = hands2D.right;
      rightHandOpacity = Math.min(255, rightHandOpacity + 255 / 10);
    } else {
      rightHandOpacity = Math.max(0, rightHandOpacity - 255 / 10);
      rightHandVelocities[rightHandVelocities.length - 1] = [];
    }

    if (rightHand.length > 0) {
      //新規の記録
      const fingerTips = getFingerTips(resizeHandpose(rightHand, 1500));
      if (isFront(rightHand2D, "right")) {
        //画面に対して正面を向いていた場合
        //末尾の配列に要素を追加していく
        const target = rightHandVelocities.length - 1;
        if (rightHandVelocities[target].length == 0) {
          //先頭要素の初期化
          rightHandVelocities[target].push(fingerTips);
          //rightHandPositionsの作成
          rightHandPositions[target] = fingerTips;
        } else {
          //初期値ではない場合
          const velocities: Keypoint[] = [];
          fingerTips.forEach((keypoint, index) => {
            velocities.push({
              x: keypoint.x - prevRightHandPosition[index].x,
              y: keypoint.y - prevRightHandPosition[index].y,
            });
          });
          rightHandVelocities[target].push(velocities);
        }
        keypointsArray.push(...fingerTips);

        //prevRightHandPositionの登録
        prevRightHandPosition = fingerTips;
      } else {
        //外枠の描画
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

        if (rightHandVelocities[rightHandVelocities.length - 1].length > 0) {
          //末尾のレコードには情報が記録されていた場合
          const initPositions =
            rightHandVelocities[rightHandVelocities.length - 1][0];
          const initVelocity = [];
          for (let i = 0; i < initPositions.length; i++) {
            initVelocity.push({
              x: initPositions[i].x - prevRightHandPosition[i].x,
              y: initPositions[i].y - prevRightHandPosition[i].y,
            });
          }
          rightHandVelocities[rightHandVelocities.length - 1][0] = initVelocity;

          //新規の配列を作成
          rightHandVelocities.push([]);
          rightHandposesHead.push(0);
          rightHandPositions.push([]);
        }
      }
    }

    if (rightHandPositions.length > 1) {
      //ログモーションの描画
      for (let i = 0; i < rightHandPositions.length; i++) {
        if (i < rightHandVelocities.length - 1) {
          rightHandposesHead[i] =
            (rightHandposesHead[i] + 1) % rightHandVelocities[i].length;
          //末尾ではない場合：末尾は現在記録中の運動
          const handPosition = rightHandPositions[i]; //Keypoint[]
          const velocity = rightHandVelocities[i][rightHandposesHead[i]];
          const newHand: Keypoint[] = [];
          for (let j = 0; j < 5; j++) {
            newHand.push({
              x: handPosition[j].x + velocity[j].x, //error
              y: handPosition[j].y + velocity[j].y,
            });
          }
          keypointsArray.push(...newHand);
          rightHandPositions[i] = newHand;
        }
      }
    }

    debugLog.current.push({
      label: "KeypointsArray length",
      value: keypointsArray.length,
    });

    p5.push();
    p5.stroke(255);
    p5.fill(255, 200);
    p5.translate(p5.width / 2, p5.height / 2 + 50);
    for (const keypoint of keypointsArray) {
      p5.ellipse(keypoint.x, keypoint.y, 3);
    }
    const indices = giftwrap(keypointsArray);
    p5.beginShape();
    for (const index of indices) {
      p5.vertex(keypointsArray[index].x, keypointsArray[index].y);
    }
    p5.endShape(p5.CLOSE);
    p5.pop();
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
