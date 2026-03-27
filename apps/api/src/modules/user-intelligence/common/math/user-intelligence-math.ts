export class UserIntelligenceMath {
  /**
   * 평균 계산 / Calculate Average (Mean)
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * 표준편차 계산 / Calculate Standard Deviation
   */
  static calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * CV (변동계수) 계산: 표준편차 / 평균 / Calculate Coefficient of Variation (StdDev / Mean)
   */
  static calculateCV(values: number[]): number {
    const avg = this.calculateAverage(values);
    if (avg === 0) return 0;
    const stdDev = this.calculateStandardDeviation(values);
    return stdDev / avg;
  }

  /**
   * 범위 내 선형 점수 변환 (Linear Interpolation)
   * 예: CV 0.3이하(30점) ~ 1.6이상(0점) 처리용 Clamping 포함
   */
  static interpolate(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ): number {
    // 범위를 벗어나는 경우 Clamping 처리
    if (inMin < inMax) {
      if (value <= inMin) return outMin;
      if (value >= inMax) return outMax;
    } else {
      // 거꾸로 된 범위 (예: 1.6 -> 0.3)
      if (value >= inMin) return outMin;
      if (value <= inMax) return outMax;
    }

    // 선형 보간 공식
    const score =
      ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.round(score * 100) / 100; // 소수점 2자리 반올림
  }

  /**
   * 상하한선 제한 (Clamping)
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
