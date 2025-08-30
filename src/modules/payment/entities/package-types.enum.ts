export enum PackageType {
  TOP_COMPANY = 1, // Top Company
  TOP_JOB = 2, // Top Job
  VIP_JOB = 3, // VIP Job
  PREMIUM_JOB = 4, // Premium Job
  AI_POINT = 5, // AI Point
}

export const PACKAGE_INFO = {
  [PackageType.TOP_COMPANY]: {
    name: 'Top Company',
    description: 'Nâng cấp công ty lên vị trí top',
    price: 500000, // 500k VND
  },
  [PackageType.TOP_JOB]: {
    name: 'Top Job',
    description: 'Đưa tin tuyển dụng lên vị trí top',
    price: 300000, // 300k VND
  },
  [PackageType.VIP_JOB]: {
    name: 'VIP Job',
    description: 'Tin tuyển dụng VIP với nhiều ưu đãi',
    price: 200000, // 200k VND
  },
  [PackageType.PREMIUM_JOB]: {
    name: 'Premium Job',
    description: 'Tin tuyển dụng Premium',
    price: 150000, // 150k VND
  },
  [PackageType.AI_POINT]: {
    name: 'AI Point',
    description: 'Mua điểm AI để sử dụng các tính năng AI',
    price: 100000, // 100k VND
  },
};
