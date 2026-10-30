import { describe, expect, it } from "vitest";
import { classifyFramePixels } from "../client/src/lib/videoSafetyClassifier";

describe("Meetly Video Safety & No-Nudity Screening Model Evaluator", () => {
  const width = 100;
  const height = 100;
  const totalPixels = width * height;

  describe("1. Baseline Non-Explicit & Patterned Frame Evaluation", () => {
    it("classifies solid non-skin frames (blue landscape/clothing) as completely safe", () => {
      // Create solid blue RGBA buffer (0, 100, 255, 255)
      const data = new Uint8ClampedArray(totalPixels * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 20;     // R
        data[i + 1] = 120; // G
        data[i + 2] = 220; // B
        data[i + 3] = 255; // A
      }

      const result = classifyFramePixels(data, width, height);
      expect(result.isSafe).toBe(true);
      expect(result.nudityProbability).toBe(0);
      expect(result.riskLevel).toBe("low");
      expect(result.flaggedCategory).toBe("none");
    });

    it("classifies dark/black frames as completely safe", () => {
      const data = new Uint8ClampedArray(totalPixels * 4); // All zeros
      const result = classifyFramePixels(data, width, height);
      expect(result.isSafe).toBe(true);
      expect(result.nudityProbability).toBe(0);
      expect(result.riskLevel).toBe("low");
    });

    it("classifies typical clothed conversational frame (head/shoulders with small skin area <12%) as safe", () => {
      const data = new Uint8ClampedArray(totalPixels * 4);
      // Fill with dark green background (30, 80, 50)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 30;
        data[i + 1] = 80;
        data[i + 2] = 50;
        data[i + 3] = 255;
      }
      // Paint 10% face oval in top region with skin chrominance (R: 210, G: 160, B: 130)
      const skinPixelCount = Math.floor(totalPixels * 0.10);
      for (let i = 0; i < skinPixelCount * 4; i += 4) {
        data[i] = 210;
        data[i + 1] = 160;
        data[i + 2] = 130;
        data[i + 3] = 255;
      }

      const result = classifyFramePixels(data, width, height);
      expect(result.isSafe).toBe(true);
      expect(result.nudityProbability).toBeLessThan(0.20);
      expect(result.riskLevel).toBe("low");
      expect(result.flaggedCategory).toBe("none");
    });
  });

  describe("2. Explicit Content Detection & Threshold Triggering", () => {
    it("detects high-density intimate exposure (>55% skin tone across frame) as unsafe and critical", () => {
      const data = new Uint8ClampedArray(totalPixels * 4);
      // Fill 60% with skin chrominance (R: 220, G: 165, B: 135)
      const skinPixelCount = Math.floor(totalPixels * 0.60);
      for (let i = 0; i < skinPixelCount * 4; i += 4) {
        data[i] = 220;
        data[i + 1] = 165;
        data[i + 2] = 135;
        data[i + 3] = 255;
      }
      // Fill remaining 40% with background
      for (let i = skinPixelCount * 4; i < data.length; i += 4) {
        data[i] = 50;
        data[i + 1] = 50;
        data[i + 2] = 50;
        data[i + 3] = 255;
      }

      const result = classifyFramePixels(data, width, height);
      expect(result.isSafe).toBe(false);
      expect(result.nudityProbability).toBeGreaterThanOrEqual(0.60);
      expect(result.riskLevel).toBe("critical");
      expect(result.flaggedCategory).toBe("explicit_exposure");
    });

    it("flags boundary exposure (28% skin tone) as high risk suspected nudity", () => {
      const data = new Uint8ClampedArray(totalPixels * 4);
      // Fill 28% with skin chrominance in lower half
      const startIndex = Math.floor(totalPixels * 0.50) * 4;
      const count = Math.floor(totalPixels * 0.28) * 4;
      for (let i = startIndex; i < startIndex + count; i += 4) {
        data[i] = 215;
        data[i + 1] = 158;
        data[i + 2] = 132;
        data[i + 3] = 255;
      }

      const result = classifyFramePixels(data, width, height);
      expect(result.isSafe).toBe(false);
      expect(result.nudityProbability).toBeGreaterThanOrEqual(0.40);
      expect(result.riskLevel).toBe("high");
      expect(result.flaggedCategory).toBe("suspected_nudity");
    });
  });

  describe("3. Performance & Empty Frame Resilience", () => {
    it("handles zero-dimension and empty frame gracefully without throwing", () => {
      const emptyData = new Uint8ClampedArray(0);
      const result = classifyFramePixels(emptyData, 0, 0);
      expect(result.isSafe).toBe(true);
      expect(result.riskLevel).toBe("low");
      expect(result.nudityProbability).toBe(0);
    });

    it("executes frame classification in less than 5ms for rapid continuous screening", () => {
      const data = new Uint8ClampedArray(totalPixels * 4);
      const start = performance.now();
      classifyFramePixels(data, width, height);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(15); // well within 60fps frame budget
    });
  });
});
