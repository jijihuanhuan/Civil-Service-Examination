/* ===== 公考倒计时 · 默认考试数据 =====
 * 数据整理时间：2026-09-12
 * 说明：`announced: true` 表示官方公告已发布（时间确定）；
 *       `announced: false` 表示按往年规律整理的预计时间，仅供参考，
 *       以官方公告为准。所有条目均可在应用内编辑。
 */
const DEFAULT_EXAMS = [
  {
    id: "gk-2027-pub",
    name: "2027国考 · 公共科目笔试",
    category: "guokao",
    enrollStart: "2026-10-15T08:00",
    enrollEnd: "2026-10-24T18:00",
    examAt: "2026-11-29T09:00",
    announced: false,
    note: "预计：公告约10月14日发布，10月15-24日网上报名，11月29日公共科目笔试。以国家公务员局公告为准。",
    source: "高顿 / 环球网校 / 中国教育在线（2026年8-9月预测）"
  },
  {
    id: "gk-2027-spec",
    name: "2027国考 · 专业科目笔试",
    category: "guokao",
    enrollStart: "2026-10-15T08:00",
    enrollEnd: "2026-10-24T18:00",
    examAt: "2026-11-28T14:00",
    announced: false,
    note: "预计：11月28日（周六）下午为专业科目（公安等岗位加试），11月29日公共科目。以国家公务员局公告为准。",
    source: "高顿（2026年8月预测）"
  },
  {
    id: "sk-liankao-2027",
    name: "多省联考 · 笔试（20余省）",
    category: "shengkao",
    enrollStart: "2027-02-01T09:00",
    enrollEnd: "2027-02-14T18:00",
    examAt: "2027-03-14T09:00",
    announced: false,
    note: "预计：公告2027年1月中下旬发布，报名2月上旬起，笔试3月中旬（参考2026年3月14-15日）。湖北/湖南/河南/安徽/江西等20余省参加，以各省公告为准。",
    source: "高顿 / 华图教育（2026年预测）"
  },
  {
    id: "sk-jiangsu-2027",
    name: "江苏省考 · 笔试",
    category: "shengkao",
    enrollStart: "2026-11-01T09:00",
    enrollEnd: "2026-11-07T18:00",
    examAt: "2026-12-05T09:00",
    announced: false,
    note: "预计：公告10月底-11月初发布，报名约7天，笔试12月上旬。以中共江苏省委组织部公告为准。",
    source: "金标尺 / 中公教育 / 腾讯新闻（2026年预测）"
  },
  {
    id: "sk-zhejiang-2027",
    name: "浙江省考 · 笔试",
    category: "shengkao",
    enrollStart: "2026-11-06T09:00",
    enrollEnd: "2026-11-11T17:00",
    examAt: "2026-12-06T09:00",
    announced: false,
    note: "参考2026届：11月6-11日报名、12月7日笔试。2027届预计11月初公告、12月上旬笔试，以浙江省公务员考试录用网公告为准。",
    source: "浙江人事考试网（2026届实况）/ 环球网校（2027届预测）"
  },
  {
    id: "sk-shandong-2027",
    name: "山东省考 · 笔试",
    category: "shengkao",
    enrollStart: "2026-11-10T09:00",
    enrollEnd: "2026-11-13T18:00",
    examAt: "2026-12-12T09:00",
    announced: false,
    note: "预计：11月公告、12月中旬笔试（时间与江浙接近，趋向提前）。以山东省公务员局公告为准。",
    source: "环球网校（2027届预测）"
  },
  {
    id: "dx-beijing-2027",
    name: "北京市定向选调 · 报名",
    category: "diaoxuan",
    enrollStart: "2026-09-20T09:00",
    enrollEnd: "2026-09-23T18:00",
    examAt: "",
    announced: true,
    note: "北京市2027年度定向选调和\u201c优培计划\u201d公告已发布，9月20-23日网上报名，笔试时间以公告为准。",
    source: "首都之窗（2026-09-10发布）"
  },
  {
    id: "dx-hubei-2027",
    name: "湖北省定向选调 · 报名",
    category: "diaoxuan",
    enrollStart: "2026-09-10T10:00",
    enrollEnd: "2026-09-22T22:00",
    examAt: "",
    announced: true,
    note: "湖北省面向高校2027届定向选调（选聘）公告已发布，9月10-22日网上报名，笔试以公告为准。",
    source: "各高校就业信息网（2026-09-10发布）"
  },
  {
    id: "dx-quanguo-2027",
    name: "各省定向选调 · 公告发布窗口",
    category: "diaoxuan",
    enrollStart: "2026-09-25T09:00",
    enrollEnd: "2026-10-31T18:00",
    examAt: "",
    announced: false,
    note: "2027届定向选调公告预计9-11月陆续发布，10月为高峰；报名窗口普遍较短（约一周），请提前关注目标省份组织部门网站。",
    source: "高顿（2026年预测）"
  }
];
