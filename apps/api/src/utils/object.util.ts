/**
 * 객체 정렬 유틸리티
 */
export class ObjectUtil {
  /**
   * 객체의 키를 알파벳 순으로 정렬하여 새로운 객체를 반환
   * 중첩된 객체도 재귀적으로 정렬
   * @param obj 정렬할 객체
   * @returns 정렬된 새로운 객체
   */
  static sortObject(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObject(item));
    }

    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        const value = obj[key];
        result[key] =
          value && typeof value === 'object' ? this.sortObject(value) : value;
        return result;
      }, {} as any);
  }

  /**
   * 객체를 JSON 문자열로 변환 (키 정렬됨)
   * @param obj 변환할 객체
   * @returns 정렬된 JSON 문자열
   */
  static toSortedJsonString(obj: any): string {
    return JSON.stringify(this.sortObject(obj));
  }

  /**
   * 두 객체가 정렬된 상태에서 동일한지 비교
   * @param obj1 첫 번째 객체
   * @param obj2 두 번째 객체
   * @returns 동일한지 여부
   */
  static isEqualSorted(obj1: any, obj2: any): boolean {
    return this.toSortedJsonString(obj1) === this.toSortedJsonString(obj2);
  }
}
