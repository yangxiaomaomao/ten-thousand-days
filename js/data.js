/* =========================================================
   宝宝的一万天 · 数据文件
   ---------------------------------------------------------
   字段说明（改内容只动这里）：
   - type   : 'main' 主线(详细描述) | 'branch' 支线(简短) | 'future' 未来憧憬
   - photo  : 我方预置图片文件名(放 photos/ 里)，留空则可现场上传
   - noPhoto: true = 这个节点不留图位；不写或 false = 留图位(可上传)
   - story  : 文案，{{day}} 会自动替换成天数；\n 换行
   - secret : （可选）彩蛋悄悄话，进详情页连点头像 5 次触发
   - 天数(day)/百分比(pct) 由 main.js 自动计算，无需手填
   =========================================================
   想把某节点在“主线/支线”之间切换：改 type 即可
   想改“有图/无图”：加或去掉 noPhoto:true
   照片默认从 photos/ 目录读取（文件名即日期，如 20140502.jpg）
   ========================================================= */

const BIRTH_DATE = '1999-03-03';
const END_DATE   = '2026-07-19';
const TOTAL_DAYS = 10000;

const NODES = [
  { id:'prologue', type:'main', special:'prologue', date:'1997-10-31', title:'序章 · 我先到啦', icon:'👦', color:'#8ec5ff', noPhoto:true,
    story:'这一天，b宝宝还没有来到这个世界，ger先到了这里。\n提前 488 天出发，占好一个「爱你」的位置，安安静静等你闪亮登场。\n原来早在你出生之前，命运就已经在为我们的相遇悄悄铺路啦。',
    secret:'早点认识你就好了，不过没关系，剩下的日子爱死你～' },

  { id:'birth', type:'main', date:'1999-03-03', title:'你出生啦', icon:'👶', color:'#ffb3c6', noPhoto:true,
    story:'宝宝出生第 0 天！\n一个软软糯糯、香香甜甜的小生命降临到这个世界啦。\n从这一刻起，世界因为有了你，而多了一整份的可爱与温柔。\n哭声超级响亮，一看就是个有主见的小公主～',
    secret:'谢谢宝宝来到这个世界，也谢谢你后来走进了我的世界。🌍' },

  { id:'b_paigu',   type:'branch', date:'2014-05-02', title:'烤排骨吃到撑', icon:'🍖', color:'#ffc59e', photo:'20140502.jpg',
    story:'吃烤排骨吃到扶墙走，无敌小馋猫。' },
  { id:'b_ktv',     type:'branch', date:'2014-05-18', title:'和姐姐去KTV', icon:'🎤', color:'#c9b6ff', photo:'20140518.jpg',
    story:'跟姐姐去 KTV 嗨唱一整晚，俩人长得真像' },

  { id:'zhongkao', type:'main', date:'2014-06-12', title:'中考', icon:'📝', color:'#a0c4ff', photo:'20140612.jpg',
    story:'宝宝出生第 {{day}} 天，马上去中考喽。\n考前和同学合拍一张缓解压力。' },

  { id:'b_chuzhong',type:'branch', date:'2014-06-20', title:'初中毕业', icon:'🎒', color:'#bdb2ff', photo:'20140620.jpg',
    story:'初中毕业啦！和同学们拍了大合照，纪念一下青春 📸' },
  { id:'b_chengdu', type:'branch', date:'2015-07-28', title:'来成都玩', icon:'🐼', color:'#caffbf', photo:'20150728.jpg',
    story:'第一次来成都玩啦！未来还会跟ger一起再去一次嘻嘻～' },
  { id:'b_jiyou',   type:'branch', date:'2015-11-28', title:'蹭集邮照', icon:'📷', color:'#ffd6a5', photo:'20151128.jpg',
    story:'蹭一下冉薪佚的集邮照，超级青涩的' },
  { id:'b_17',      type:'branch', date:'2016-02-23', title:'17岁生日', icon:'🎂', color:'#ffc8dd', photo:'20160223.jpg',
    story:'17 岁生日快乐，又长大了一岁的我的berber，还有6年才会遇到ger。' },

  { id:'adult18', type:'main', date:'2017-03-03', title:'十八岁成人礼', icon:'🎉', color:'#ffd6a5', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，正式长大成人！\n这一年你偷偷许下的那些愿望，后来啊，大多都一个个实现了呢。' },

  { id:'gaokao', type:'main', date:'2017-06-07', title:'高考', icon:'✏️', color:'#a0c4ff', photo:'20170607.jpg',
    story:'宝宝出生第 {{day}} 天，俯拍高中，马上高考\n一定可以的！加油宝宝ß' },

  { id:'college1', type:'main', date:'2017-08-27', title:'第一次走进大学', icon:'🏫', color:'#9bf6ff', photo:'20170827.jpg',
    story:'宝宝出生第 {{day}} 天，第一次踏进大学校园！\n拖着行李箱，眼里满是新奇与激动。\n属于你的青春大幕，就在这一天正式拉开啦。' },

  { id:'b_junxun1', type:'branch', date:'2017-09-04', title:'要军训了', icon:'😣', color:'#a0c4ff', noPhoto:true,
    story:'马上要军训了，好紧张啊……' },
  { id:'b_gdcai',   type:'branch', date:'2017-09-09', title:'吃不惯广东菜', icon:'🥲', color:'#ffc59e', noPhoto:true,
    story:'太吃不惯广东的菜了，好想念家乡味。' },
  { id:'b_junxun2', type:'branch', date:'2017-09-10', title:'军训偷偷臭美', icon:'💁‍♀️', color:'#ffc8dd', photo:'20170910.jpg',
    story:'军训期间也要偷偷臭美一下，爱美是天性嘛～' },
  { id:'b_canton',  type:'branch', date:'2017-09-30', title:'小蛮腰', icon:'🌆', color:'#bdb2ff', photo:'20170930.jpg',
    story:'肖姥姥进大观园，来广州小蛮腰打卡啦！' },
  { id:'b_gz_eat',  type:'branch', date:'2017-10-02', title:'广州逛吃', icon:'🍜', color:'#ffd6a5', photo:'20171002.jpg',
    story:'国庆假期和高中同学一起在广州逛吃逛吃！' },
  { id:'b_100days', type:'branch', date:'2017-10-13', title:'倒数回家', icon:'🏠', color:'#caffbf', photo:'20171013.jpg',
    story:'超级无敌大馋猫，盼着还有 100 天就能回家啦～' },
  { id:'b_paper',   type:'branch', date:'2017-11-14', title:'凌晨肝论文', icon:'💻', color:'#c9b6ff', photo:'20171114.jpg',
    story:'凌晨还在肝论文，刚入学的学生动力就是足！' },
  { id:'b_lipstick',type:'branch', date:'2017-11-18', title:'买口红被当小学生', icon:'💄', color:'#ff8fb1', photo:'20171118.jpg',
    story:'买口红被当成小学生，哈哈哈——殊不知以后这个场景还会出现无数次哈哈哈哈哈。' },
  { id:'b_cheer',   type:'branch', date:'2017-11-19', title:'运动会啦啦队', icon:'📣', color:'#ffb3c6', photo:'20171119.jpg',
    story:'运动会去当啦啦队，嘻嘻，元气满满！' },
  { id:'b_yangrou', type:'branch', date:'2017-12-22', title:'炭火羊肉煲', icon:'🍲', color:'#ffc59e', photo:'20171222.jpg',
    story:'和小姐妹去吃老广州味的炭火羊肉煲，约好以后还要一起吃老北京涮羊肉。' },
  { id:'b_cq1',     type:'branch', date:'2018-01-20', title:'第一次回重庆', icon:'🌶️', color:'#ff8fb1', photo:'20180120.jpg',
    story:'入学后第一次回重庆，终于可以吃好吃的啦！' },
  { id:'b_swim',    type:'branch', date:'2018-02-08', title:'和粑粑游泳', icon:'🏊', color:'#9bf6ff', photo:'20180208.jpg',
    story:'跟粑粑一起游泳，笑成了一朵花。' },
  { id:'b_leave',   type:'branch', date:'2018-03-03', title:'又要离家', icon:'🧳', color:'#c9b6ff', photo:'20180303.jpg',
    story:'又要离家了，哎……真舍不得。' },
  { id:'b_intern1', type:'branch', date:'2018-03-25', title:'珠海万豪实习', icon:'🏨', color:'#bdb2ff', photo:'20180325.jpg',
    story:'大一最后一次实习，珠海万豪，好累呀。' },
  { id:'b_home1',   type:'branch', date:'2018-07-28', title:'想回家', icon:'🏡', color:'#ffd6a5', noPhoto:true,
    story:'日常想回家 ing……' },
  { id:'b_village', type:'branch', date:'2019-07-21', title:'村落访谈', icon:'📋', color:'#caffbf', photo:'20190721.jpg',
    story:'到传统村落访谈村民 ing……做学问的小学者。' },

  { id:'bachelor', type:'main', date:'2021-06-28', title:'本科毕业', icon:'🎓', color:'#bdb2ff', photo:'20210628.jpg',
    story:'宝宝出生第 {{day}} 天，本科毕业啦！\n把学士帽抛向天空的那一刻，青春定格成了最灿烂的模样。\n恭喜你，顺利通关人生一个超级重要的大关卡～' },

  { id:'b_gubei1',  type:'branch', date:'2022-10-16', title:'古北水镇(独自)', icon:'🏯', color:'#a0c4ff', photo:'20221016.jpg',
    story:'来古北水镇啦，嘻嘻～那时就想着：未来我还要再来一次！距离认识哥儿只剩1天，铛铛铛铛！' },

  { id:'meet', type:'main', date:'2022-10-17', title:'我们相识', icon:'🌟', color:'#ffc8dd', photo:'20221017.jpg',
    story:'宝宝出生第 {{day}} 天，我们相识了。\n谢谢宝宝为哥儿的生活带来不一样的颜色嘻嘻',
    secret:'哥哥锐评：一见钟情。嘻嘻' },

  { id:'together', type:'main', date:'2022-10-25', title:'我们在一起', icon:'💕', color:'#ff8fb1', photo:'20221025.jpg',
    story:'宝宝出生第 {{day}} 天，我们正式在一起啦！\n从相识到牵手，只用了短短 8 天。\n原来最好的爱情，是刚刚好的心动，加上刚刚好的勇气。',
    secret:'那 8 天里我每天都在偷偷计划怎么表白，紧张得要命～' },

  { id:'b_iceski',  type:'branch', date:'2022-11-04', title:'冰立方滑冰', icon:'⛸️', color:'#9bf6ff', photo:'20221104.jpg',
    story:'和未来老公一起去冰立方滑冰啦，他好笨啊哈哈哈。' },
  { id:'b_youzi',   type:'branch', date:'2022-11-19', title:'吊柚子给我', icon:'🍊', color:'#ffd6a5', photo:'20221119.jpg',
    story:'疫情期间他剥好柚子，从窗户吊下来给我，暖到心里啦。' },
  { id:'b_tianjin', type:'branch', date:'2022-12-30', title:'天津之旅', icon:'🥟', color:'#ffc59e', photo:'20221230.jpg',
    story:'天津之旅！跨年喝酒海河，幸福！。' },
  { id:'b_teletubby',type:'branch', date:'2023-01-04', title:'天线宝宝集合', icon:'📺', color:'#caffbf', photo:'20230104.jpg',
    story:'天线宝宝集合！可可爱爱一整队。' },
  { id:'b_xian',    type:'branch', date:'2023-01-07', title:'西安古都', icon:'🏯', color:'#ffc59e', photo:'20230107.jpg',
    story:'来西安啦！看兵马俑、逛古城墙，肉夹馍和凉皮吃到扶墙走，好吃东西实在太多了！～' },
  { id:'b_gubei2',  type:'branch', date:'2023-03-10', title:'两个人的古北', icon:'🏯', color:'#ff8fb1', photo:'20230310.jpg',
    story:'这次是两个人的古北水镇啦——愿望达成，嘻嘻！' },
  { id:'b_shandong',type:'branch', date:'2023-04-27', title:'来山东啦', icon:'⛰️', color:'#a0c4ff', photo:'20230427.jpg',
    story:'来山东啦！，济南曲阜济宁泰安，会当凌绝顶，一览众山小！⛰' },
  { id:'b_datong',  type:'branch', date:'2023-06-21', title:'来大同啦', icon:'🗿', color:'#bdb2ff', photo:'20230621.jpg',
    story:'来大同啦，一起看云冈石窟的千年微笑，哦对了还有恒山呢，五岳吊车尾' },

  { id:'parents', type:'main', date:'2023-07-29', title:'我们见家长啦', icon:'👨‍👩‍👧', color:'#ff85a1', photo:'20230729.jpg',
    story:'宝宝出生第 {{day}} 天，我们见家长啦！\n直接冲到重庆家事访问，冲冲冲，下一步求婚喽！' },

  { id:'b_guan',    type:'branch', date:'2023-09-28', title:'来固安啦', icon:'🚗', color:'#ffc8dd', photo:'20230928.jpg',
    story:'来固安啦！又解锁一个新地方，第一次一起做饭！！菌菇汤超级好喝！' },
  { id:'b_harbin',  type:'branch', date:'2023-12-29', title:'哈尔滨跨年', icon:'❄️', color:'#9bf6ff', photo:'20231229.jpg',
    story:'来哈尔滨跨年啦，冰雪大世界超级美！' },

  { id:'surgery', type:'main', date:'2024-02-19', title:'第一次手术', icon:'🏥', color:'#ffadad', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，你经历了第一次手术——胆囊手术。\n往后余生，再不缺席',
    secret:'呜呜呜~~' },

  { id:'firsthome', type:'main', date:'2024-04-16', title:'北京第一个家', icon:'🏠', color:'#ffb3c6', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，我们在白家疃有了第一个家。\n虽然不大，却装满了温柔的烟火气——\n从此漂泊的城市里，有了一盏专门为我们俩亮着的灯。' },

  { id:'master', type:'main', date:'2025-05-08', title:'硕士答辩', icon:'📚', color:'#9bf6ff', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，硕士答辩顺利通过！\n太棒啦！！。' },

  { id:'firstoffer', type:'main', date:'2025-05-09', title:'拿到第一个offer', icon:'📩', color:'#ffd6a5', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，拿到人生第一个 offer 啦！\n准备去上班啦——从今往后，你要奔赴属于自己的闪亮舞台了，宝宝真的好棒！' },

  { id:'b_taiyuan', type:'branch', date:'2025-05-22', title:'来太原啦', icon:'🥟', color:'#a0c4ff', photo:'20250522.jpg',
    story:'来太原啦，山西的老陈醋配面食，管够管够～' },
  { id:'b_xinzhou', type:'branch', date:'2025-05-23', title:'忻州小憩', icon:'⛰️', color:'#caffbf', photo:'20250523.jpg',
    story:'转场到忻州古城，一路向北，风景越走越美。' },

  { id:'doubledegree', type:'main', date:'2025-07-01', title:'中丹学院双学位', icon:'🏅', color:'#caffbf', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，拿到中丹学院双学位！' },

  { id:'job', type:'main', date:'2025-07-08', title:'正式入职', icon:'💼', color:'#fdffb6', noPhoto:true,
    story:'宝宝出生第 {{day}} 天，正式入职，成为闪闪发光的打工人啦！\n人生新篇章正式开启，从校园一步步走向社会。\n不管走到哪里，你都依旧勇敢、认真，又那么可爱。' },

  { id:'propose', type:'main', date:'2025-07-12', title:'被求婚', icon:'💍', color:'#ff85a1', photo:'20250712.jpg',
    story:'宝宝出生第 {{day}} 天，你在天台山答应嫁给我啦！\n戒指戴上手指的那一刻，我的心跳快得像在打鼓。\n谢谢你愿意牵起我的手，和我一起走向未来的每一个明天。',
    secret:'世界上最伟大的求婚策划不接受反驳谢谢！' },

  { id:'zhangbei', type:'main', date:'2025-08-23', title:'第一次自驾·张北草原', icon:'🚗', color:'#caffbf', photo:'20250823.jpg',
    story:'宝宝出生第 {{day}} 天，berber第一次自驾，去张北草原啦！\n方向盘握在你手里的那一刻，又酷又飒。\n蓝天白云、一望无际的草原，风里都是自由的味道——我的宝宝越来越厉害啦。' },

  { id:'b_shenyang', type:'branch', date:'2025-09-12', title:'来沈阳啦', icon:'🏛️', color:'#a0c4ff', photo:'20250912.jpg',
    story:'来沈阳啦，逛沈阳故宫、吃地道烧烤，东北的热情挡不住～' },
  { id:'b_dandong',  type:'branch', date:'2025-09-13', title:'丹东看江', icon:'🌉', color:'#9bf6ff', photo:'20250913.jpg',
    story:'到丹东啦，鸭绿江边走一走，还有鲜掉眉毛的海鲜！' },

  { id:'b_baoding', type:'branch', date:'2025-11-15', title:'去保定啦', icon:'🐴', color:'#ffc59e', photo:'20251115.jpg',
    story:'去保定啦，驴肉火烧必须安排！' },
  { id:'b_wulanchabu', type:'branch', date:'2026-01-01', title:'乌兰察布火山', icon:'🌋', color:'#ffc59e', photo:'20260101.jpg',
    story:'新年第一天，来乌兰察布看火山群，超级震撼！' },
  { id:'b_hohhot', type:'branch', date:'2026-01-02', title:'来呼和浩特啦', icon:'🐎', color:'#bdb2ff', photo:'20260102.jpg',
    story:'来呼和浩特啦，青城的奶茶和手把肉，通通安排！' },
  { id:'b_huangshan',type:'branch', date:'2026-01-31', title:'来黄山啦', icon:'⛰️', color:'#a0c4ff', photo:'20260131.jpg',
    story:'来黄山啦，登高望远，云海超美。' },
  { id:'b_shijiazhuang', type:'branch', date:'2026-03-21', title:'来石家庄啦', icon:'🎸', color:'#ffc8dd', photo:'20260321.jpg',
    story:'来石家庄啦——夜晚在街头巷尾步行，宁静而浓厚的爱！' },
  { id:'b_qhd',     type:'branch', date:'2026-05-02', title:'秦皇岛看海', icon:'🌊', color:'#9bf6ff', photo:'20260502.jpg',
    story:'来秦皇岛玩啦，一起去看海！' },

  { id:'tenthousand', type:'main', special:'finale', date:'2026-07-19', title:'一万天快乐', icon:'🍲', color:'#e63946', noPhoto:true,
    story:'宝宝出生第 10000 天！🎉\n整整一万天的努力与成长，才换来今天这个如此优秀、如此可爱的你。\n今天，我们一起去吃海底捞庆祝——\n因为往后的每一天，我都想陪你吃遍好吃的、看遍好风景。\n一万天快乐，我最爱的宝宝！❤️',
    secret:'其实一万天只是个开始，我想陪你过第二万天、第三万天……直到数不清为止。' },

  /* ================= 未来憧憬（无固定日期，梦想中） ================= */
  { id:'f_wedding', type:'future', title:'穿上婚纱', icon:'🚗', color:'#b39ddb', noPhoto:true,
    story:'恭喜您俩，成为尊贵的小米/沃尔沃/梅赛德斯奔驰车主！' },
  { id:'f_wedding', type:'future', title:'穿上婚纱', icon:'💒', color:'#ffd6e7', noPhoto:true,
    story:'噔噔蹬蹬，噔噔蹬蹬，你愿意嫁给他吗，我愿意，你愿意娶她为妻吗，我愿意！' },
  { id:'f_travel', type:'future', title:'看遍星辰大海', icon:'✈️', color:'#a0c4ff', noPhoto:true,
    story:'我们要去遍世界上每个有趣的角落和地方！' },
  { id:'f_home', type:'future', title:'更大的家', icon:'🪴', color:'#caffbf', noPhoto:true,
    story:'把小小的家换成更大的家，阳台上种满你喜欢的花，\n厨房里飘着你爱吃的饭菜香。' },
  { id:'f_baby', type:'future', title:'也许会有小家伙', icon:'🍼', color:'#ffb3c6', noPhoto:true,
    story:'也许会有一个像你一样可爱的小家伙，\n奶声奶气地喊我们爸爸妈妈。' },
  { id:'f_forever', type:'future', title:'一起慢慢变老', icon:'👵👴', color:'#b39ddb', noPhoto:true,
    story:'陪你从青丝到白发，一起慢慢变老。\n一万天只是序章，往后的每一天，我都要和你一起写下去。💞' }
];

/* 彩蛋：连点头像 5 次时，若节点没写 secret，就随机抽一句 */
const SECRET_POOL = [
  '被你发现了啦，嘻嘻，berber工作不要太累哦',
  '路上一定要注意安全，平时要保持好心情呀！！',
  'ger超爱你的',
  '再次祝宝宝诞生10000天快乐',
  '小秘密：以后每天，我都想陪你重新看一遍这一万天。',
  'ger一直喜欢盯着你看，嘿嘿'
];

/* 流星划过时的许愿悄悄话（星空主题） */
const WISH_POOL = [
  '✨ 快许愿berber，许你的许我的，许我们的',
  '🌠 许不许愿都行，反正哥儿把所有愿望都帮你实现',
  '💫 啊呀，好肉麻啊',
  '⭐ 有星星来了，快许愿',
  '🌙 愿我们永远像现在一样幸福快乐！'
];
