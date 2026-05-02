const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const state = {
  lang: localStorage.getItem("lang") || "en",
  mode: "rail",
  placeCategory: "food",
  user: null,
  activeTicketId: localStorage.getItem("activeTicketId"),
  activeTicket: null,
  activeTrip: null,
  routeChoice: "fast",
  pendingPayment: null,
  map: null,
  markers: [],
  visiblePlaces: [],
  countdownSeconds: 299,
};

const copy = {
  en: {
    brandSub: "Bangkok destination mobility OS",
    navRoute: "Route",
    navExplore: "Explore",
    navTicket: "Ticket",
    navReport: "Report",
    heroBadge: "Bangkok-only pilot",
    heroTitle: "Move like local, discover like traveler.",
    heroBody: "A tourist-first mobility layer that blends EV bus and boat loops, rail connectors, trusted local context, and an 8-45 THB fair-fare cap.",
    origin: "Origin",
    destination: "Destination landmark",
    planRoute: "Plan route",
    recommendedRoute: "Best integrated journey",
    finalFare: "Final fare",
    time: "Time",
    stops: "Stops",
    saved: "Saved",
    fareBreakdown: "Receipt-style fare breakdown",
    routeDetails: "What to do next",
    fastest: "Fastest",
    cheapest: "Cheapest",
    scenic: "Scenic",
    boardAt: "Board",
    validateAt: "Validate",
    transferAt: "Transfer",
    exitAt: "Exit",
    exploreAround: "Explore around destination",
    touristContext: "Tourist context",
    wowFactor: "The wow factor",
    ticketTitle: "3D Holographic Fair-Fare Pass",
    generateTicket: "Issue my Joint Ticket",
    reportTitle: "Report a transit issue",
    reportBody: "Report service issues tied to your bus, skytrain, boat, QR scan, fare charge, or route guidance.",
    storyTourismTitle: "EV destination loop",
    storyTourismBody: "Connect temples, riverfront malls, Yaowarat, and food stops through buses and boats tourists can understand.",
    storyFareTitle: "8-45 THB Fair-Fare Cap",
    storyFareBody: "One trip session removes duplicate entry fees and caps connected bus, rail, and boat journeys at 45 THB.",
    storyPromiseTitle: "Landmark first, mode second",
    storyPromiseBody: "Visitors choose where they want to go. The app explains what to board, where to transfer, and why the fare is fair.",
    aiEyebrow: "AI Trip Intelligence",
    aiTitle: "Your arrival plan, not just a route.",
    aiBody: "The copilot reads curated destination facts, live POIs, incident reports, and fare state to answer the real tourist question: I arrived. What now?",
    aiExit: "Exit guidance",
    aiExitBody: "Which gate, pier, or stop to use.",
    aiContext: "Local context",
    aiContextBody: "Food, etiquette, safety, opening hints.",
    aiFare: "Fare proof",
    aiFareBody: "Why this scan costs what it costs.",
    aiRecoveryTitle: "Recovery planner",
    aiRecoveryBody: "Re-plan from current location when a tourist boards the wrong vehicle.",
    aiFareAuditTitle: "Fare auditor",
    aiFareAuditBody: "Explain every scan and show remaining charge before the 45 THB cap.",
    aiReportTitle: "Report assistant",
    aiReportBody: "Draft structured incident reports from tourist text and trip context.",
    ragPreview: "RAG answer preview",
    arrivalBriefTitle: "Destination arrival brief",
    askAiStop: "Ask Sawasdee AI about this stop",
    simulateScan: "Simulate staff scan and payment",
    authEyebrow: "Secure demo auth",
    authTitle: "Create your ticket profile",
    authBody: "A session cookie links the Fair-Fare pass to a tourist profile. API keys and payment tokens stay server-side in production.",
    authSubmit: "Sign in and continue",
    tripConsoleEyebrow: "Trip test console",
    tripConsoleTitle: "Scan timeline and wallet proof",
    tripConsoleBody: "Use this in the pitch to prove each operator scan is stored, capped, then charged from a prepaid wallet.",
    walletLabel: "Wallet",
    startTrip: "Start trip session",
    scanNextLeg: "Scan next leg",
    endAndPay: "End and pay",
    noTripYet: "No active trip session yet.",
    logout: "Sign out",
    paymentEyebrow: "Operator scan",
    paymentTitle: "Confirm fare charge",
    paymentOperatorLabel: "Operator",
    paymentRawLabel: "Raw fare",
    paymentBilledLabel: "Already billed today",
    paymentCapNote: "Fair-Fare cap checks remaining charge before payment.",
    paymentConfirmLabel: "Confirm charge",
    confirmPay: "Confirm and pay",
    workflowEyebrow: "How the trip actually works",
    workflowTitle: "One QR, many scans, one capped session.",
    workflowBadge: "Designed for transfers and detours",
    workflowStep1: "Start session",
    workflowStep1Body: "Scan at the first rail gate, bus validator, boat pier, or staff scanner.",
    workflowStep2: "Follow next leg",
    workflowStep2Body: "The app tells you the next station, pier, stop, or feeder vehicle to validate.",
    workflowStep3: "Recover if wrong",
    workflowStep3Body: "If you board the wrong vehicle or stop midway, AI replans from current location using the same pass.",
    workflowStep4: "Pay only at validation",
    workflowStep4Body: "Each scan records the operator and charge, then the backend caps the session before payment.",
    fairUseEyebrow: "Fair-use control",
    fairUseTitle: "The cap is for a planned journey, not unlimited random riding.",
    fairUse1: "Route intent locks the destination and expected mode sequence before the first scan.",
    fairUse2: "Transfers have a time/distance window. Detours trigger AI re-plan and operator review flags.",
    fairUse3: "Operators are paid per validated leg, while passengers see one capped fare session.",
  },
  th: {
    brandSub: "ระบบเดินทางท่องเที่ยวกรุงเทพฯ",
    navRoute: "เส้นทาง",
    navExplore: "สำรวจ",
    navTicket: "บัตร",
    navReport: "แจ้งปัญหา",
    heroBadge: "โครงการนำร่องกรุงเทพฯ",
    heroTitle: "เดินทางเหมือนคนพื้นที่ เที่ยวเหมือนนักเดินทาง",
    heroBody: "รวมรถบัสและเรือ EV รถไฟฟ้า บริบทท้องถิ่น และเพดานค่าเดินทาง 8-45 บาทให้เข้าใจง่ายในแอพเดียว",
    origin: "ต้นทาง",
    destination: "แลนด์มาร์กปลายทาง",
    planRoute: "ค้นหาเส้นทาง",
    recommendedRoute: "เส้นทางรวมที่แนะนำ",
    finalFare: "จ่ายจริง",
    time: "เวลา",
    stops: "สถานี",
    saved: "ประหยัด",
    fareBreakdown: "รายละเอียดค่าโดยสารแบบใบเสร็จ",
    routeDetails: "ต้องทำอะไรต่อ",
    fastest: "เร็วที่สุด",
    cheapest: "ถูกที่สุด",
    scenic: "ชมวิว/สับสนน้อย",
    boardAt: "ขึ้นที่",
    validateAt: "สแกนที่",
    transferAt: "ต่อที่",
    exitAt: "ออกที่",
    exploreAround: "สำรวจรอบจุดหมาย",
    touristContext: "บริบทสำหรับนักท่องเที่ยว",
    wowFactor: "ฟีเจอร์เด่น",
    ticketTitle: "บัตร Fair-Fare 3D Holographic",
    generateTicket: "ออกบัตร Fair-Fare",
    reportTitle: "แจ้งปัญหาการเดินทาง",
    reportBody: "แจ้งปัญหาที่ผูกกับรถเมล์ รถไฟฟ้า เรือ QR ค่าโดยสาร หรือคำแนะนำเส้นทางของแอพ",
    storyTourismTitle: "วงรอบ EV เชื่อมจุดหมาย",
    storyTourismBody: "เชื่อมวัด ห้างริมแม่น้ำ เยาวราช และจุดอาหารด้วยรถบัสและเรือที่นักท่องเที่ยวเข้าใจง่าย",
    storyFareTitle: "เพดานค่าเดินทาง 8-45 บาท",
    storyFareBody: "หนึ่ง trip session ลดค่าแรกเข้าซ้ำ และคุมรถเมล์ รถไฟฟ้า เรือ ไม่เกิน 45 บาท",
    storyPromiseTitle: "เลือกแลนด์มาร์กก่อน เลือกโหมดทีหลัง",
    storyPromiseBody: "ผู้ใช้เลือกว่าจะไปไหน แอพบอกว่าขึ้นอะไร ต่อที่ไหน และทำไมราคานี้ถึงยุติธรรม",
    aiEyebrow: "AI ช่วยเดินทาง",
    aiTitle: "ไม่ใช่แค่เส้นทาง แต่คือแผนเมื่อถึงปลายทาง",
    aiBody: "Copilot อ่านข้อมูลจุดหมาย POI รายงานปัญหา และสถานะค่าโดยสาร เพื่อตอบคำถามจริงของนักท่องเที่ยวว่า ถึงแล้วต้องทำอะไรต่อ",
    aiExit: "ทางออก/จุดขึ้น",
    aiExitBody: "ควรใช้ประตู ท่าเรือ หรือป้ายไหน",
    aiContext: "บริบทท้องถิ่น",
    aiContextBody: "อาหาร มารยาท ความปลอดภัย เวลาเปิด",
    aiFare: "เหตุผลค่าโดยสาร",
    aiFareBody: "สแกนนี้คิดเงินเท่าไร เพราะอะไร",
    aiRecoveryTitle: "วางแผนเมื่อหลงทาง",
    aiRecoveryBody: "ใช้ตำแหน่งปัจจุบันช่วย re-plan เมื่อขึ้นผิดคันหรือเลยจุดต่อรถ",
    aiFareAuditTitle: "ตรวจสอบค่าโดยสาร",
    aiFareAuditBody: "อธิบายทุก scan และยอดที่เหลือก่อนชนเพดาน 45 บาท",
    aiReportTitle: "ช่วยร่างรายงาน",
    aiReportBody: "แปลงข้อความนักท่องเที่ยวเป็นรายงานปัญหาแบบมีโครงสร้าง",
    ragPreview: "ตัวอย่างคำตอบ RAG",
    arrivalBriefTitle: "สรุปเมื่อถึงปลายทาง",
    askAiStop: "ถาม Sawasdee AI เกี่ยวกับจุดนี้",
    simulateScan: "จำลองเจ้าหน้าที่สแกนและชำระเงิน",
    authEyebrow: "ระบบยืนยันตัวตนเดโม",
    authTitle: "สร้างโปรไฟล์บัตรเดินทาง",
    authBody: "Session cookie ผูกบัตร Fair-Fare กับโปรไฟล์นักท่องเที่ยว ส่วน API key และ payment token อยู่ฝั่ง server",
    authSubmit: "เข้าสู่ระบบและไปต่อ",
    tripConsoleEyebrow: "คอนโซลทดสอบทริป",
    tripConsoleTitle: "ไทม์ไลน์สแกนและหลักฐานการหักเงิน",
    tripConsoleBody: "ใช้ตอน pitch เพื่อพิสูจน์ว่าทุกการสแกนถูกบันทึก คุมเพดาน และหักจาก wallet จริง",
    walletLabel: "Wallet",
    startTrip: "เริ่มทริป",
    scanNextLeg: "สแกนช่วงถัดไป",
    endAndPay: "จบทริปและชำระเงิน",
    noTripYet: "ยังไม่มีทริปที่กำลังใช้งาน",
    logout: "ออกจากระบบ",
    paymentEyebrow: "เจ้าหน้าที่สแกน",
    paymentTitle: "ยืนยันยอดชำระ",
    paymentOperatorLabel: "ผู้ให้บริการ",
    paymentRawLabel: "ค่าโดยสารก่อน cap",
    paymentBilledLabel: "จ่ายแล้ววันนี้",
    paymentCapNote: "ระบบ Fair-Fare ตรวจยอดที่เหลือก่อนคิดเงิน",
    paymentConfirmLabel: "ยอดที่ต้องจ่าย",
    confirmPay: "ยืนยันและชำระเงิน",
    workflowEyebrow: "ระบบเดินทางทำงานอย่างไร",
    workflowTitle: "QR เดียว สแกนหลายครั้ง แต่เป็น session เดียวที่มีเพดาน",
    workflowBadge: "ออกแบบเพื่อการต่อรถและการหลงทาง",
    workflowStep1: "เริ่ม session",
    workflowStep1Body: "สแกนที่ประตูรถไฟฟ้า เครื่องบนรถเมล์ จุดท่าเรือ หรือเจ้าหน้าที่ครั้งแรก",
    workflowStep2: "ไป leg ถัดไป",
    workflowStep2Body: "แอพบอกสถานี ท่าเรือ ป้าย หรือรถ feeder ถัดไปที่ต้องไป validate",
    workflowStep3: "แก้ทางถ้าพลาด",
    workflowStep3Body: "ถ้าขึ้นผิดคันหรือแวะกลางทาง AI จะ re-plan จากตำแหน่งปัจจุบันโดยใช้บัตรเดิม",
    workflowStep4: "จ่ายตอน validate",
    workflowStep4Body: "ทุก scan บันทึกผู้ให้บริการและค่าโดยสาร แล้ว backend คุมเพดานก่อนชำระเงิน",
    fairUseEyebrow: "กติกาการใช้งานที่สมเหตุสมผล",
    fairUseTitle: "เพดานราคาใช้กับการเดินทางที่มีจุดหมาย ไม่ใช่นั่งสุ่มได้ไม่จำกัด",
    fairUse1: "ระบบล็อกจุดหมายและลำดับ mode ที่คาดว่าจะใช้ก่อน scan แรก",
    fairUse2: "การต่อรถมีกรอบเวลา/ระยะทาง หากออกนอกเส้นจะให้ AI re-plan และ flag ตรวจสอบ",
    fairUse3: "ผู้ให้บริการได้รับส่วนแบ่งตาม leg ที่ validate ส่วนผู้โดยสารเห็นเป็น session เดียวที่มีเพดาน",
  },
};

const landmarks = [
  {
    id: "siam",
    en: "Siam",
    th: "สยาม",
    node: "BTS CEN",
    lat: 13.7466,
    lng: 100.5347,
    image: "/assets/generated/bangkok-brochure-en-cover.jpg",
    context: { en: "Shopping, arts, and major rail interchange.", th: "ย่านช้อปปิ้ง ศิลปะ และจุดต่อรถไฟฟ้าหลัก" },
  },
  {
    id: "wat-arun",
    en: "Wat Arun",
    th: "วัดอรุณ",
    node: "Tha Tien Pier / MRT Sanam Chai",
    lat: 13.7437,
    lng: 100.4889,
    image: "/assets/landmarks/wat-arun.jpg",
    context: { en: "Riverside temple, best around sunset.", th: "วัดริมแม่น้ำเจ้าพระยา เหมาะช่วงเย็น" },
  },
  {
    id: "grand-palace",
    en: "Grand Palace",
    th: "พระบรมมหาราชวัง",
    node: "MRT Sanam Chai / Pier N9",
    lat: 13.7500,
    lng: 100.4913,
    image: "/assets/landmarks/grand-palace.jpg",
    context: { en: "Royal landmark. Check dress code and opening hours.", th: "แลนด์มาร์กราชสำนัก ควรตรวจ dress code และเวลาเปิด" },
  },
  {
    id: "yaowarat",
    en: "Wat Mangkon / Yaowarat",
    th: "วัดมังกร / เยาวราช",
    node: "MRT BL29",
    lat: 13.7422,
    lng: 100.5090,
    image: "/assets/landmarks/yaowarat.jpg",
    context: { en: "Street food, Chinatown heritage, evening walk.", th: "street food, ย่านจีนเก่า และเดินเที่ยวช่วงเย็น" },
  },
  {
    id: "iconsiam",
    en: "ICONSIAM",
    th: "ไอคอนสยาม",
    node: "Gold Line / Pier CAT",
    lat: 13.7266,
    lng: 100.5106,
    image: "/assets/generated/bangkok-map-preview.jpg",
    context: { en: "Riverfront shopping and indoor Thai market experience.", th: "ศูนย์การค้าริมน้ำและโซนตลาดไทยในร่ม" },
  },
  {
    id: "chatuchak",
    en: "Chatuchak Weekend Market",
    th: "ตลาดนัดจตุจักร",
    node: "BTS N8 / MRT BL13",
    lat: 13.7996,
    lng: 100.5501,
    image: "/assets/generated/bangkok-brochure-th-cover.jpg",
    context: { en: "Weekend market. Expect heat, crowds, and long walking.", th: "ตลาดสุดสัปดาห์ ควรเผื่ออากาศร้อนและการเดินเยอะ" },
  },
];

const accessPlans = {
  "wat-arun": {
    en: ["Board: MRT to Sanam Chai or river connector to Tha Tien", "Transfer: cross-river ferry or EV boat stop", "Arrival: Wat Arun pier, walk 3-5 minutes to entrance"],
    th: ["ขึ้นรถ: MRT สนามไชย หรือเส้นทางต่อท่าเตียน", "ต่อระบบ: เรือข้ามฟากหรือจุดจอดเรือ EV", "ถึงปลายทาง: ท่าวัดอรุณ เดิน 3-5 นาทีถึงทางเข้า"],
  },
  "grand-palace": {
    en: ["Board: MRT Sanam Chai or bus feeder to Rattanakosin", "Transfer: walk via Museum Siam / Tha Chang corridor", "Arrival: Grand Palace gate, check dress code"],
    th: ["ขึ้นรถ: MRT สนามไชย หรือ feeder เข้ารัตนโกสินทร์", "ต่อระบบ: เดินผ่าน Museum Siam / โซนท่าช้าง", "ถึงปลายทาง: ประตูพระบรมมหาราชวัง ตรวจ dress code"],
  },
  yaowarat: {
    en: ["Board: MRT Blue Line to Wat Mangkon", "Transfer: Exit 1/2 toward Yaowarat Road", "Arrival: walk the food street loop, evening is best"],
    th: ["ขึ้นรถ: MRT สายสีน้ำเงินไปวัดมังกร", "ต่อระบบ: ใช้ทางออก 1/2 ไปถนนเยาวราช", "ถึงปลายทาง: เดิน loop street food เหมาะช่วงเย็น"],
  },
  iconsiam: {
    en: ["Board: BTS to Krung Thon Buri or boat connector", "Transfer: Gold Line / river pier shuttle", "Arrival: ICONSIAM entrance, indoor fallback in rain"],
    th: ["ขึ้นรถ: BTS กรุงธนบุรี หรือเรือเชื่อมต่อ", "ต่อระบบ: Gold Line / shuttle ท่าเรือ", "ถึงปลายทาง: ทางเข้าไอคอนสยาม เหมาะเป็นตัวเลือกในวันที่ฝนตก"],
  },
  siam: {
    en: ["Board: BTS to Siam interchange", "Transfer: follow skywalk to malls or BACC", "Arrival: central walking zone, dense but signed"],
    th: ["ขึ้นรถ: BTS ไปสถานีสยาม", "ต่อระบบ: ใช้ skywalk ไปห้างหรือ BACC", "ถึงปลายทาง: โซนเดินกลางเมือง ป้ายชัดแต่คนหนาแน่น"],
  },
  chatuchak: {
    en: ["Board: BTS Mo Chit or MRT Chatuchak Park", "Transfer: use Kamphaeng Phet for market access", "Arrival: large walking area, save meeting point"],
    th: ["ขึ้นรถ: BTS หมอชิต หรือ MRT สวนจตุจักร", "ต่อระบบ: ใช้กำแพงเพชรเพื่อเข้าตลาด", "ถึงปลายทาง: พื้นที่ใหญ่มาก ควรบันทึกจุดนัดพบ"],
  },
};

const routeModes = {
  rail: {
    title: { en: "Fair-Fare route: rail spine + EV feeder", th: "เส้นทาง Fair-Fare: รถไฟฟ้าแกนหลัก + EV feeder" },
    note: { en: "Use rail for the long segment, then connect to the tourist loop without paying duplicate entry fees.", th: "ใช้รถไฟฟ้าเป็นแกนหลัก แล้วต่อเข้าโครงข่ายท่องเที่ยวโดยไม่เสียค่าแรกเข้าซ้ำ" },
    time: 28,
    stops: 8,
    fare: 49,
    total: 45,
    lines: [
      { label: "Rail base fare + distance", fare: 33 },
      { label: "EV feeder / pier connector", fare: 16 },
    ],
    steps: [
      { icon: "1", title: "Choose the landmark, not the line", th: "เลือกแลนด์มาร์ก ไม่ต้องเลือกสายเอง", detail: "Start at {originNode}. The app picks the rail spine and tourism feeder for {destination}.", detailTh: "เริ่มที่ {originNode} แอพเลือกแกนรถไฟฟ้าและ feeder ท่องเที่ยวไป {destination} ให้" },
      { icon: "2", title: "Scan once into one fare session", th: "สแกนครั้งแรกเพื่อเปิด fare session เดียว", detail: "The backend starts one trip session and stops duplicate entry fees across connected modes.", detailTh: "backend เปิด trip session เดียว และกันค่าแรกเข้าซ้ำเมื่อเปลี่ยนระบบ" },
      { icon: "3", title: "Transfer to EV bus / boat loop", th: "ต่อรถบัส EV หรือเรือ EV loop", detail: "At the interchange, show the same QR to the operator or gate staff.", detailTh: "ถึงจุดต่อระบบ แสดง QR เดิมกับผู้ให้บริการหรือเจ้าหน้าที่" },
      { icon: "4", title: "Arrive with capped billing", th: "ถึงจุดหมายพร้อมค่าโดยสารมีเพดาน", detail: "Exit near {destNode}. The trip stays inside the 45 THB cap simulation.", detailTh: "ออกใกล้ {destNode} และค่าโดยสารอยู่ในเพดานจำลอง 45 บาท" },
    ],
  },
  bus: {
    title: { en: "Destination Day Loop: EV bus focused", th: "Destination Day Loop: เน้นรถบัส EV" },
    note: { en: "Tourism-first loop for hop-on/hop-off style travel. Cheaper, clearer, and more local than point-to-point taxi.", th: "loop ท่องเที่ยวแบบขึ้นลงได้หลายจุด ถูกและเข้าใจง่ายกว่าเรียกรถเป็นเที่ยว" },
    time: 42,
    stops: 12,
    fare: 24,
    total: 24,
    lines: [
      { label: "EV bus base fare", fare: 8 },
      { label: "Distance component, approx. 16 km", fare: 16 },
    ],
    steps: [
      { icon: "1", title: "Walk to the EV loop stop", th: "เดินไปป้าย EV loop", detail: "Use the numbered map pin closest to {originNode}.", detailTh: "ใช้ pin หมายเลขที่ใกล้ {originNode} ที่สุด" },
      { icon: "2", title: "Board with QR, no cash confusion", th: "ขึ้นรถด้วย QR ไม่สับสนเรื่องเงินสด", detail: "The pass records boarding time, route, and fare split for operators.", detailTh: "บัตรบันทึกเวลาขึ้น เส้นทาง และการแบ่งค่าโดยสารให้ผู้ให้บริการ" },
      { icon: "3", title: "Hop off at landmark cluster", th: "ลงที่ cluster แลนด์มาร์ก", detail: "Use the destination POI cards to pick food, shopping, or cultural stops around {destination}.", detailTh: "ใช้การ์ด POI เลือกร้านอาหาร ห้าง หรือจุดเที่ยวรอบ {destination}" },
    ],
  },
  boat: {
    title: { en: "River Discovery: rail + EV boat", th: "River Discovery: รถไฟฟ้า + เรือ EV" },
    note: { en: "Best for Wat Arun, Grand Palace, ICONSIAM, and sunset tourism while keeping fare logic transparent.", th: "เหมาะกับวัดอรุณ พระบรมมหาราชวัง ไอคอนสยาม และการเที่ยวริมน้ำ โดยค่าโดยสารโปร่งใส" },
    time: 45,
    stops: 7,
    fare: 66,
    total: 45,
    lines: [
      { label: "Rail to river interchange", fare: 45 },
      { label: "Chao Phraya boat segment", fare: 21 },
    ],
    steps: [
      { icon: "1", title: "Ride rail to river interchange", th: "นั่งรถไฟฟ้าไปจุดต่อเรือ", detail: "Use {originNode} to reach Saphan Taksin or Sanam Chai depending on destination.", detailTh: "ใช้ {originNode} ไปจุดต่อเรือ เช่น สะพานตากสินหรือสนามไชยตามจุดหมาย" },
      { icon: "2", title: "Transfer to pier", th: "เดินต่อไปท่าเรือ", detail: "Follow pier signage. The app keeps the same ticket session active.", detailTh: "ตามป้ายไปท่าเรือ แอพยังใช้ session บัตรเดิมอยู่" },
      { icon: "3", title: "Scan with boat operator", th: "สแกนกับผู้ให้บริการเรือ", detail: "Boat fare is added until the 45 THB cap is reached.", detailTh: "ค่าเรือจะถูกคิดรวมจนถึงเพดาน 45 บาท" },
      { icon: "4", title: "Walk to landmark entrance", th: "เดินเข้าจุดหมาย", detail: "Exit at the nearest pier for {destination}.", detailTh: "ขึ้นจากท่าเรือที่ใกล้ {destination} ที่สุด" },
    ],
  },
};

const destinationRoutes = {
  "wat-arun": {
    fast: {
      modes: ["MRT", "Walk/Ferry"],
      time: 31,
      fare: 45,
      confidence: "highest clarity",
      thConfidence: "เข้าใจง่ายสุด",
      legs: [
        { type: "rail", title: "MRT Blue Line to Sanam Chai", th: "MRT สายสีน้ำเงินไปสนามไชย", detail: "Exit toward Museum Siam / Tha Tien corridor.", detailTh: "ออกทาง Museum Siam / ทางไปท่าเตียน", scan: "MRT entry and exit gates", scanTh: "ประตูเข้า-ออกรถไฟฟ้า MRT", fare: 32 },
        { type: "walk", title: "Walk to Tha Tien pier", th: "เดินไปท่าเตียน", detail: "Follow river / Wat Pho signs, about 8-10 minutes.", detailTh: "ตามป้ายแม่น้ำ/วัดโพธิ์ ประมาณ 8-10 นาที", scan: "No charge, keep QR active", scanTh: "ไม่คิดเงิน เก็บ QR ไว้", fare: 0 },
        { type: "boat", title: "Cross-river ferry to Wat Arun", th: "เรือข้ามฟากไปวัดอรุณ", detail: "Board to Wat Arun pier, then walk 3-5 minutes to the entrance.", detailTh: "ลงท่าวัดอรุณแล้วเดิน 3-5 นาทีถึงทางเข้า", scan: "Pier staff scanner", scanTh: "เจ้าหน้าที่ท่าเรือสแกน", fare: 13 },
      ],
    },
    cheap: {
      modes: ["BMTA/EV Bus", "Walk"],
      time: 46,
      fare: 24,
      confidence: "lowest fare",
      thConfidence: "ประหยัดสุด",
      legs: [
        { type: "bus", title: "Board an old-town feeder bus toward Rattanakosin", th: "ขึ้น feeder bus เข้าเกาะรัตนโกสินทร์", detail: "Use the app pin to verify the exact stop before boarding.", detailTh: "ใช้ pin ในแอพยืนยันป้ายก่อนขึ้นรถ", scan: "Bus validator at boarding", scanTh: "เครื่องสแกนบนรถตอนขึ้น", fare: 16 },
        { type: "walk", title: "Walk via Tha Tien / riverside corridor", th: "เดินผ่านท่าเตียน/แนวริมแม่น้ำ", detail: "Good for daylight. AI re-plans if traffic changes the stop.", detailTh: "เหมาะช่วงกลางวัน หากรถเปลี่ยนจุดจอด AI จะ re-plan", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
        { type: "boat", title: "Short ferry or pier connector", th: "เรือข้ามฟากระยะสั้น", detail: "Use the same QR if the pier supports validation.", detailTh: "ใช้ QR เดิมหากท่าเรือรองรับการสแกน", scan: "Pier scanner", scanTh: "จุดสแกนท่าเรือ", fare: 8 },
      ],
    },
    scenic: {
      modes: ["BTS", "Boat"],
      time: 44,
      fare: 45,
      confidence: "best tourist experience",
      thConfidence: "ประสบการณ์ท่องเที่ยวดีที่สุด",
      legs: [
        { type: "rail", title: "BTS Silom Line to Saphan Taksin", th: "BTS สายสีลมไปสะพานตากสิน", detail: "Exit 2 toward Sathorn / Central Pier.", detailTh: "ออกทางออก 2 ไปท่าสาทร/Central Pier", scan: "BTS gate entry and exit", scanTh: "ประตู BTS เข้าและออก", fare: 28 },
        { type: "walk", title: "Walk 3-5 minutes to Sathorn Pier", th: "เดิน 3-5 นาทีไปท่าสาทร", detail: "Follow pier signage, avoid taxi touts near the walkway.", detailTh: "ตามป้ายท่าเรือ ระวังคนชวนขึ้นรถ/ทัวร์นอกระบบ", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
        { type: "boat", title: "Boat northbound to Wat Arun / Tha Tien area", th: "นั่งเรือขึ้นเหนือไปวัดอรุณ/ท่าเตียน", detail: "Great for first-time visitors and sunset storytelling.", detailTh: "เหมาะกับนักท่องเที่ยวครั้งแรกและวิวช่วงเย็น", scan: "Boat/pier validator", scanTh: "เครื่องสแกนบนเรือหรือท่าเรือ", fare: 21 },
      ],
    },
  },
  "grand-palace": {
    fast: {
      modes: ["MRT", "Walk"],
      time: 26,
      fare: 35,
      confidence: "least traffic risk",
      thConfidence: "เสี่ยงรถติดน้อยสุด",
      legs: [
        { type: "rail", title: "MRT Blue Line to Sanam Chai", th: "MRT สายสีน้ำเงินไปสนามไชย", detail: "Exit toward Museum Siam / Rattanakosin.", detailTh: "ออกทาง Museum Siam / รัตนโกสินทร์", scan: "MRT entry and exit gates", scanTh: "ประตู MRT เข้าและออก", fare: 32 },
        { type: "walk", title: "Walk to Grand Palace gate", th: "เดินไปประตูพระบรมมหาราชวัง", detail: "Follow signed old-town walking corridor; check dress code before entry.", detailTh: "เดินตามทางเมืองเก่า ตรวจ dress code ก่อนเข้า", scan: "No transit charge", scanTh: "ไม่คิดค่าเดินทาง", fare: 0 },
      ],
    },
    cheap: {
      modes: ["Bus", "Walk"],
      time: 38,
      fare: 18,
      confidence: "lowest fare",
      thConfidence: "ถูกสุด",
      legs: [
        { type: "bus", title: "Board Rattanakosin feeder bus", th: "ขึ้นรถ feeder เข้ารัตนโกสินทร์", detail: "Confirm route direction in app before boarding.", detailTh: "เช็กทิศทางในแอพก่อนขึ้น", scan: "Bus validator", scanTh: "เครื่องสแกนบนรถ", fare: 18 },
        { type: "walk", title: "Walk from Tha Chang / Sanam Luang area", th: "เดินจากท่าช้าง/สนามหลวง", detail: "Use shaded side when possible; save meeting point.", detailTh: "เดินฝั่งมีร่มเมื่อทำได้ และบันทึกจุดนัดพบ", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
      ],
    },
    scenic: {
      modes: ["BTS", "Boat", "Walk"],
      time: 43,
      fare: 45,
      confidence: "riverfront route",
      thConfidence: "เส้นทางริมแม่น้ำ",
      legs: [
        { type: "rail", title: "BTS to Saphan Taksin", th: "BTS ไปสะพานตากสิน", detail: "Walk to Sathorn Pier.", detailTh: "เดินต่อไปท่าสาทร", scan: "BTS gates", scanTh: "ประตู BTS", fare: 28 },
        { type: "boat", title: "Boat to Tha Chang / Maharaj area", th: "เรือไปท่าช้าง/ท่ามหาราช", detail: "Good when roads are congested.", detailTh: "เหมาะเมื่อถนนรถติด", scan: "Pier validator", scanTh: "จุดสแกนท่าเรือ", fare: 21 },
        { type: "walk", title: "Walk to entrance", th: "เดินไปทางเข้า", detail: "Follow Grand Palace signs and staff guidance.", detailTh: "ตามป้ายและคำแนะนำเจ้าหน้าที่", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
      ],
    },
  },
  yaowarat: {
    fast: {
      modes: ["MRT"],
      time: 18,
      fare: 32,
      confidence: "direct rail",
      thConfidence: "รถไฟฟ้าตรงสุด",
      legs: [
        { type: "rail", title: "MRT Blue Line to Wat Mangkon", th: "MRT สายสีน้ำเงินไปวัดมังกร", detail: "Use Exit 1/2 toward Yaowarat Road.", detailTh: "ใช้ทางออก 1/2 ไปถนนเยาวราช", scan: "MRT entry and exit gates", scanTh: "ประตู MRT เข้าและออก", fare: 32 },
        { type: "walk", title: "Walk food street loop", th: "เดิน loop street food", detail: "Evening is best; sidewalks are crowded.", detailTh: "ช่วงเย็นดีที่สุด ทางเท้าคนแน่น", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
      ],
    },
    cheap: {
      modes: ["Bus"],
      time: 34,
      fare: 18,
      confidence: "budget route",
      thConfidence: "ประหยัด",
      legs: [
        { type: "bus", title: "Board old-town bus toward Chinatown", th: "ขึ้นรถเมล์เข้าเยาวราช", detail: "Best when not in rush hour.", detailTh: "เหมาะนอกเวลาเร่งด่วน", scan: "Bus validator", scanTh: "เครื่องสแกนบนรถ", fare: 18 },
        { type: "walk", title: "Hop off near Yaowarat Road", th: "ลงใกล้ถนนเยาวราช", detail: "AI can re-plan if you miss the stop.", detailTh: "ถ้าเลยป้าย AI ช่วย re-plan ได้", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
      ],
    },
    scenic: {
      modes: ["Boat", "Walk"],
      time: 39,
      fare: 30,
      confidence: "river + food",
      thConfidence: "ริมแม่น้ำ + ของกิน",
      legs: [
        { type: "boat", title: "Boat to Ratchawong Pier", th: "เรือไปท่าราชวงศ์", detail: "Walk into Chinatown from the pier.", detailTh: "เดินเข้าเยาวราชจากท่าเรือ", scan: "Pier/boat validator", scanTh: "สแกนที่ท่าเรือ/บนเรือ", fare: 21 },
        { type: "walk", title: "Walk to Yaowarat food street", th: "เดินไปถนนอาหารเยาวราช", detail: "Good for tourists who want a river arrival.", detailTh: "เหมาะกับนักท่องเที่ยวที่อยากได้บรรยากาศริมน้ำ", scan: "No charge", scanTh: "ไม่คิดเงิน", fare: 0 },
      ],
    },
  },
};

function routeSetFor(dest) {
  return destinationRoutes[dest.id] || destinationRoutes["wat-arun"];
}

function t(key) {
  return copy[state.lang][key] || copy.en[key] || key;
}

function currentOrigin() {
  return landmarks.find((item) => item.id === $("#originSelect").value) || landmarks[0];
}

function currentDestination() {
  return landmarks.find((item) => item.id === $("#destinationSelect").value) || landmarks[1];
}

function localName(place) {
  return place[state.lang] || place.en;
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  $("#langToggle").textContent = state.lang === "en" ? "TH" : "EN";
  $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  fillSelects();
  renderQuickPrompts();
  renderRoute();
  renderExplore();
  renderTripSession();
}

function fillSelects() {
  const oldOrigin = $("#originSelect").value || "siam";
  const oldDestination = $("#destinationSelect").value || "wat-arun";
  const options = landmarks.map((place) => `<option value="${place.id}">${localName(place)} · ${place.node}</option>`).join("");
  $("#originSelect").innerHTML = options;
  $("#destinationSelect").innerHTML = options;
  $("#originSelect").value = oldOrigin;
  $("#destinationSelect").value = oldDestination;
}

function hydrateStep(template, origin, dest) {
  const title = state.lang === "th" ? template.th : template.title;
  const detail = state.lang === "th" ? template.detailTh : template.detail;
  return {
    title,
    detail: detail
      .replaceAll("{originNode}", origin.node)
      .replaceAll("{destNode}", dest.node)
      .replaceAll("{destination}", localName(dest)),
  };
}

function renderRoute() {
  const mode = routeModes[state.mode];
  const origin = currentOrigin();
  const dest = currentDestination();
  const detailedRoutes = routeSetFor(dest);
  const choice = detailedRoutes[state.routeChoice] || detailedRoutes.fast;
  const saved = Math.max(0, mode.fare - mode.total);
  $("#routeTitle").textContent = `${localName(origin)} → ${localName(dest)}`;
  $("#routeNote").textContent = mode.note[state.lang];
  $("#routeTime").textContent = `~${mode.time} ${state.lang === "th" ? "นาที" : "min"}`;
  $("#routeStops").textContent = `${mode.stops} ${state.lang === "th" ? "จุด/สถานี" : "nodes"}`;
  $("#routeSaved").textContent = `${saved} THB`;
  $("#finalFare").textContent = `${mode.total}฿`;
  $("#ticketOrigin").value = origin.en;
  $("#ticketDestination").value = dest.en;
  $("#aiContextChip").textContent = state.lang === "th"
    ? `แชทนี้กำลังตอบเรื่อง ${localName(dest)} · ${state.mode.toUpperCase()}`
    : `Answering about ${localName(dest)} · ${state.mode.toUpperCase()}`;
  renderRouteChoices(detailedRoutes);
  renderRouteLegTimeline(choice);

  $("#farePanel").innerHTML = `
    <div class="space-y-3 text-sm font-semibold">
      ${mode.lines.map((line) => `<div class="flex justify-between gap-4"><span>${line.label}</span><span>${line.fare} THB</span></div>`).join("")}
      <div class="border-t border-dashed border-slate-300 pt-3 flex justify-between text-slate-500"><span>Subtotal without policy cap</span><span>${mode.fare} THB</span></div>
      <div class="rounded-2xl bg-amber-100 px-4 py-3 flex justify-between gap-4 font-black text-amber-800"><span>Joint Ticket Cap Applied</span><span>-${saved} THB</span></div>
      <div class="flex items-end justify-between pt-1"><span class="text-base font-black">Total billed today</span><span class="text-3xl font-black text-transit-teal">${mode.total} THB</span></div>
      <p class="rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-slate-500">Fare logic: bus starts at 8 THB plus distance, rail starts at 15 THB plus distance, and one connected journey is capped at 45 THB. EV tourism loops become the visitor-friendly feeder layer.</p>
    </div>`;

  $("#routeSteps").innerHTML = mode.steps.map((step, index) => {
    const rendered = hydrateStep(step, origin, dest);
    return `
      <div class="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${index === 1 ? "bg-transit-ink text-white" : "bg-transit-mint text-transit-teal"} text-sm font-black">${step.icon}</div>
        <div>
          <p class="font-black">${rendered.title}</p>
          <p class="mt-1 text-sm font-semibold leading-6 text-slate-500">${rendered.detail}</p>
        </div>
      </div>`;
  }).join("");

  const access = accessPlans[dest.id]?.[state.lang] || accessPlans[dest.id]?.en || [];
  $("#accessPlan").innerHTML = access.map((item, index) => `
    <div class="rounded-2xl bg-slate-50 p-4">
      <span class="grid h-8 w-8 place-items-center rounded-full bg-transit-ink text-xs font-black text-white">${index + 1}</span>
      <p class="mt-3 text-sm font-black leading-6">${escapeHtml(item)}</p>
    </div>`).join("");

  $$(".mode-btn").forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("bg-white", active);
    button.classList.toggle("text-transit-blue", active);
    button.classList.toggle("text-white/80", !active);
  });
}

function renderRouteChoices(routes) {
  const order = [
    ["fast", t("fastest")],
    ["cheap", t("cheapest")],
    ["scenic", t("scenic")],
  ];
  $("#routeChoiceCards").innerHTML = order.map(([key, label]) => {
    const route = routes[key];
    if (!route) return "";
    const active = state.routeChoice === key;
    return `
      <button data-route-choice="${key}" class="route-choice-card ${active ? "active" : ""}">
        <span class="choice-kicker">${active ? "Selected route" : "Choose route"}</span>
        <strong>${label}</strong>
        <em>${route.time} ${state.lang === "th" ? "นาที" : "min"} · ${route.fare} THB</em>
        <small>${escapeHtml(state.lang === "th" ? route.thConfidence : route.confidence)} · ${route.modes.join(" + ")}</small>
        <b>${active ? (state.lang === "th" ? "กำลังแสดงรายละเอียดนี้" : "Details shown below") : (state.lang === "th" ? "กดเพื่อเปลี่ยนเส้นทาง" : "Tap to switch")}</b>
      </button>`;
  }).join("");
}

function renderRouteLegTimeline(route) {
  $("#routeLegTimeline").innerHTML = `
    <div class="rounded-3xl bg-white p-4 ring-1 ring-slate-100">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.16em] text-transit-teal">BKK Rail-style leg plan</p>
          <h3 class="mt-1 text-lg font-black">${route.time} ${state.lang === "th" ? "นาที" : "min"} · ${route.fare} THB · ${route.modes.join(" + ")}</h3>
        </div>
        <span class="rounded-full bg-transit-mint px-3 py-1 text-xs font-black text-transit-teal">${route.fare > 45 ? "45 cap" : "inside cap"}</span>
      </div>
      <div class="space-y-3">
        ${route.legs.map((leg, index) => `
          <div class="route-leg-row">
            <div class="route-leg-rail"><span>${index + 1}</span></div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-500">${leg.type}</span>
                <p class="font-black">${escapeHtml(state.lang === "th" ? leg.th : leg.title)}</p>
              </div>
              <p class="mt-1 text-sm font-semibold leading-6 text-slate-500">${escapeHtml(state.lang === "th" ? leg.detailTh : leg.detail)}</p>
              <div class="mt-2 grid gap-2 text-xs font-black text-slate-500 sm:grid-cols-2">
                <span class="rounded-2xl bg-slate-50 px-3 py-2">${t("validateAt")}: ${escapeHtml(state.lang === "th" ? leg.scanTh : leg.scan)}</span>
                <span class="rounded-2xl bg-slate-50 px-3 py-2">Fare event: ${leg.fare} THB</span>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>`;
}

function initMap() {
  const dest = currentDestination();
  if (!window.maplibregl) return;
  try {
    state.map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [dest.lng, dest.lat],
      zoom: 14,
      attributionControl: false,
    });
    state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    state.map.on("load", () => {
      $("#mapFallback").classList.add("opacity-0");
      renderExplore();
    });
    state.map.on("error", () => $("#mapFallback").classList.remove("opacity-0"));
  } catch {
    $("#mapFallback").classList.remove("opacity-0");
  }
}

async function renderExplore() {
  const dest = currentDestination();
  $("#exploreTitle").textContent = `${localName(dest)} area`;
  $("#mapContext").textContent = dest.context[state.lang];
  $("#mapFallback").src = dest.image;
  updatePlaceChips();

  const fallback = landmarks.filter((place) => place.id !== dest.id).slice(0, 4).map((place) => ({
    id: place.id,
    name: localName(place),
    latitude: place.lat,
    longitude: place.lng,
    kind: place.node,
    source: "Curated Bangkok landmark",
    distance_m: null,
    image: place.image,
  }));
  const places = await loadPlaces(dest, fallback);
  renderPoiCards([{ id: dest.id, name: localName(dest), latitude: dest.lat, longitude: dest.lng, kind: dest.node, source: "Selected destination", image: dest.image }, ...places]);
}

async function loadPlaces(dest, fallback) {
  try {
    const url = `/api/places/nearby?lat=${dest.lat}&lng=${dest.lng}&category=${state.placeCategory}&radius=1200`;
    const places = await request(url);
    return places.length ? places : fallback;
  } catch {
    return fallback;
  }
}

function renderPoiCards(places) {
  state.visiblePlaces = places;
  $("#poiCarousel").innerHTML = places.map((place, index) => {
    const image = place.image || imageForCategory(state.placeCategory, index);
    const label = index === 0 ? "Destination" : place.source === "OpenStreetMap" ? "Verified map data" : place.source;
    const distance = place.distance_m ? ` · ${place.distance_m}m` : "";
    const mapsUrl = googleMapsUrl(place);
    return `
      <article data-poi-index="${index}" class="min-w-[260px] cursor-pointer overflow-hidden rounded-[1.75rem] bg-white shadow-card transition hover:-translate-y-1">
        <div class="relative">
          ${place.image ? `<img class="h-36 w-full object-cover" src="${image}" alt="${escapeHtml(place.name)}" />` : `<div class="poi-visual grid h-36 place-items-center p-5 text-center text-white"><div><p class="text-xs font-black uppercase tracking-[0.18em] opacity-70">${escapeHtml(place.kind || state.placeCategory)}</p><p class="mt-2 text-2xl font-black">${index === 0 ? "Destination" : `Place ${index}`}</p></div></div>`}
          <span class="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-transit-ink text-sm font-black text-white shadow-card">${index === 0 ? "★" : index}</span>
        </div>
        <div class="p-4">
          <span class="rounded-full ${index === 0 ? "bg-transit-mint text-transit-teal" : "bg-blue-100 text-transit-blue"} px-3 py-1 text-xs font-black">${label}</span>
          <div class="mt-3 flex items-center gap-1 text-sm font-black text-amber-500" aria-label="Mock five star rating">★★★★★ <span class="ml-1 text-xs text-slate-400">5.0 demo</span></div>
          <h3 class="mt-3 text-lg font-black">${escapeHtml(place.name)}</h3>
          <p class="mt-1 text-sm font-semibold text-slate-500">${escapeHtml(place.kind || "POI")}${distance}</p>
          <div class="mt-3 flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-slate-400">Tap card to focus pin.</p>
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="rounded-full bg-transit-ink px-3 py-2 text-xs font-black text-white" onclick="event.stopPropagation()">Google Maps</a>
          </div>
        </div>
      </article>`;
  }).join("");

  if (state.map) {
    state.markers.forEach((marker) => marker.remove());
    state.markers = places.map((place, index) => {
      const el = document.createElement("div");
      el.className = `map-marker ${index === 0 ? "active" : ""}`;
      el.textContent = index === 0 ? "★" : String(index);
      el.addEventListener("click", () => focusPlace(index));
      const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(popupHtml(place, index));
      return new maplibregl.Marker({ element: el }).setLngLat([place.longitude, place.latitude]).setPopup(popup).addTo(state.map);
    });
    const dest = currentDestination();
    state.map.flyTo({ center: [dest.lng, dest.lat], zoom: 14, essential: false });
  }
}

function focusPlace(index) {
  const place = state.visiblePlaces[index];
  if (!place || !state.map) return;
  state.map.flyTo({ center: [place.longitude, place.latitude], zoom: index === 0 ? 14.5 : 16, essential: true });
  const marker = state.markers[index];
  if (marker) marker.togglePopup();
}

function popupHtml(place, index) {
  const pin = index === 0 ? "Destination" : `Stop ${index}`;
  const distance = place.distance_m ? `${place.distance_m}m from landmark` : place.source;
  const mapsUrl = googleMapsUrl(place);
  return `
    <div style="font-family: Inter, sans-serif; min-width: 190px;">
      <div style="font-size: 11px; font-weight: 900; color: #05866f; text-transform: uppercase;">${pin}</div>
      <div style="margin-top: 4px; font-size: 15px; font-weight: 900; color: #0f1f2e;">${escapeHtml(place.name)}</div>
      <div style="margin-top: 4px; font-size: 12px; font-weight: 800; color: #f59e0b;">★★★★★ 5.0 demo</div>
      <div style="margin-top: 4px; font-size: 12px; font-weight: 700; color: #64748b;">${escapeHtml(place.kind || "POI")} · ${escapeHtml(distance)}</div>
      <a href="${mapsUrl}" target="_blank" rel="noopener" style="display:inline-block; margin-top:10px; border-radius:999px; background:#0f1f2e; color:white; padding:8px 10px; font-size:12px; font-weight:900; text-decoration:none;">Open Google Maps</a>
    </div>`;
}

function googleMapsUrl(place) {
  const lat = Number(place.latitude).toFixed(6);
  const lng = Number(place.longitude).toFixed(6);
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function imageForCategory(category, index) {
  const images = {
    food: ["/assets/landmarks/yaowarat.jpg", "/assets/generated/bangkok-brochure-th-cover.jpg"],
    shopping: ["/assets/generated/bangkok-map-preview.jpg", "/assets/generated/bangkok-brochure-en-cover.jpg"],
    attractions: ["/assets/landmarks/wat-arun.jpg", "/assets/landmarks/grand-palace.jpg"],
    transport: ["/assets/generated/bangkok-map-preview.jpg", "/assets/landmarks/yaowarat.jpg"],
  };
  return images[category][index % images[category].length];
}

function updatePlaceChips() {
  $$(".place-chip").forEach((button) => {
    const active = button.dataset.placeCategory === state.placeCategory;
    button.classList.toggle("bg-transit-ink", active);
    button.classList.toggle("text-white", active);
    button.classList.toggle("bg-slate-100", !active);
    button.classList.toggle("text-slate-600", !active);
  });
}

function wireEvents() {
  $("#langToggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "th" : "en";
    localStorage.setItem("lang", state.lang);
    applyLanguage();
  });

  $("#originSelect").addEventListener("change", renderRoute);
  $("#destinationSelect").addEventListener("change", () => {
    renderRoute();
    renderExplore();
  });
  $("#lostHelpBtn").addEventListener("click", () => askSuggested(state.lang === "th" ? "ฉันหลงทางระหว่างต่อรถ ควรทำยังไง?" : "I am lost during transfer. What should I do?"));
  $("#planRouteBtn").addEventListener("click", () => {
    $("#farePanel").classList.remove("hidden");
    $("#fareChevron").classList.add("rotate-180");
    $("#routeSteps").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#routeChoiceCards").addEventListener("click", (event) => {
    const card = event.target.closest("[data-route-choice]");
    if (!card) return;
    state.routeChoice = card.dataset.routeChoice;
    renderRoute();
  });
  $$(".mode-btn").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    renderRoute();
  }));
  $$(".place-chip").forEach((button) => button.addEventListener("click", () => {
    state.placeCategory = button.dataset.placeCategory;
    renderExplore();
  }));
  $("#poiCarousel").addEventListener("click", (event) => {
    const card = event.target.closest("[data-poi-index]");
    if (!card) return;
    focusPlace(Number(card.dataset.poiIndex));
  });
  $("#fareToggle").addEventListener("click", () => {
    $("#farePanel").classList.toggle("hidden");
    $("#fareChevron").classList.toggle("rotate-180");
  });

  $("#tapToUseBtn").addEventListener("click", () => {
    const shell = document.querySelector(".ticket-shell");
    shell.classList.toggle("flipped");
    $("#tapToUseBtn").textContent = shell.classList.contains("flipped") ? "Hide QR" : "Tap to Use";
  });
  $("#simulateScanBtn").addEventListener("click", openPaymentFlow);
  $("#closePaymentSheet").addEventListener("click", closeSheets);
  $("#confirmPaymentBtn").addEventListener("click", confirmPayment);
  $("#startTripBtn").addEventListener("click", startTripSession);
  $("#simulateLegBtn").addEventListener("click", simulateNextLeg);
  $("#endTripBtn").addEventListener("click", endTripSession);
  $("#askAiRouteBtn").addEventListener("click", () => {
    askSuggested(state.lang === "th" ? `สรุปเมื่อถึง ${localName(currentDestination())} ให้หน่อย` : `Give me an arrival brief for ${localName(currentDestination())}`);
  });
  $("#quickPrompts").addEventListener("click", (event) => {
    const button = event.target.closest("[data-prompt]");
    if (button) askSuggested(button.dataset.prompt);
  });

  $("#authButton").addEventListener("click", openAuthSheet);
  $("#closeAuthSheet").addEventListener("click", closeSheets);
  $("#authForm").addEventListener("submit", submitAuth);
  $("#logoutBtn").addEventListener("click", logout);
  $("#ticketForm").addEventListener("submit", submitTicket);

  $("#openReportBtn").addEventListener("click", openReportSheet);
  $("#navReportBtn").addEventListener("click", openReportSheet);
  $("#mobileReportBtn").addEventListener("click", openReportSheet);
  $("#closeReportSheet").addEventListener("click", closeSheets);
  $("#reportForm").addEventListener("submit", submitReport);
  $("#useNow").addEventListener("click", () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    $("#incidentTime").value = local.toISOString().slice(0, 16);
  });

  $("#aiFab").addEventListener("click", openAiSheet);
  $("#closeSheet").addEventListener("click", closeSheets);
  $("#sheetOverlay").addEventListener("click", closeSheets);
  $("#chatForm").addEventListener("submit", sendChat);
  $("#chatLog").addEventListener("click", (event) => {
    const button = event.target.closest(".suggestion");
    if (button) askSuggested(button.dataset.prompt);
  });
}

async function loadMe() {
  try {
    state.user = await request("/api/auth/me");
    await loadActiveTrip();
  } catch {
    state.user = null;
    state.activeTrip = null;
  }
  renderAuthState();
  renderTripSession();
}

function renderAuthState() {
  const label = state.user ? state.user.display_name.split(" ")[0] : "Sign in";
  $("#authButton").textContent = label;
  $("#authMessage").textContent = state.user ? `Signed in as ${state.user.email}` : "";
  $("#walletBalance").textContent = state.user ? state.user.balance_thb : "--";
  $("#logoutBtn").classList.toggle("hidden", !state.user);
  if (state.user) {
    $("#ticketHolderInput").value = state.user.display_name;
    $("#ticketHolder").textContent = state.user.display_name;
  }
}

async function submitAuth(event) {
  event.preventDefault();
  $("#authMessage").textContent = "Signing in...";
  try {
    state.user = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    renderAuthState();
    await loadActiveTrip();
    renderTripSession();
    $("#authMessage").textContent = "Ready. You can issue a Joint Ticket now.";
    setTimeout(closeSheets, 450);
  } catch (error) {
    $("#authMessage").textContent = error.message;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.activeTrip = null;
  renderAuthState();
  renderTripSession();
}

async function submitTicket(event) {
  event.preventDefault();
  if (!state.user) {
    $("#ticketMessage").textContent = "Sign in first so the ticket has an owner.";
    openAuthSheet();
    return;
  }
  $("#ticketMessage").textContent = "Issuing secure ticket...";
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ticket = await request("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.activeTicketId = ticket.id;
    localStorage.setItem("activeTicketId", ticket.id);
    renderTicket(ticket);
    $("#ticketMessage").textContent = "Ticket ready. Tap to show QR to operator.";
  } catch (error) {
    $("#ticketMessage").textContent = error.message;
  }
}

function renderTicket(ticket) {
  state.activeTicket = ticket;
  $("#ticketStatus").textContent = ticket.status.toUpperCase();
  $("#ticketHolder").textContent = ticket.holder_name;
  $("#ticketUsed").textContent = ticket.accumulated_fare_thb;
  $("#ticketBilled").textContent = ticket.accumulated_fare_thb;
  $("#ticketRides").textContent = ticket.rides_count;
  $("#ticketQr").src = `/api/tickets/${ticket.id}/qr.svg?ts=${Date.now()}`;
  $("#ticketQr").hidden = false;
  $("#qrEmpty").hidden = true;
}

function openPaymentFlow() {
  if (!state.activeTicket) {
    $("#ticketMessage").textContent = "Generate a ticket first, then simulate the staff scan.";
    return;
  }
  const dest = currentDestination();
  const fareByMode = { rail: 32, bus: 16, boat: 21 };
  const rawFare = fareByMode[state.mode] || 17;
  const already = state.activeTicket.accumulated_fare_thb || 0;
  const charge = Math.min(rawFare, Math.max(0, 45 - already));
  state.pendingPayment = {
    mode: state.mode === "rail" ? "rail" : state.mode,
    station_name: dest.node,
    fare_thb: rawFare,
    charged_thb: charge,
  };
  $("#paymentOperator").textContent = `${state.mode.toUpperCase()} · ${dest.node}`;
  $("#paymentRawFare").textContent = `${rawFare} THB`;
  $("#paymentAlready").textContent = `${already} THB`;
  $("#paymentCharge").textContent = `${charge} THB`;
  $("#paymentMessage").textContent = charge === 0 ? "Cap reached. This scan is validated with no extra charge." : "Review the fare before confirming.";
  openSheet("#paymentSheet");
}

async function confirmPayment() {
  if (!state.activeTicket || !state.pendingPayment) return;
  $("#paymentMessage").textContent = "Validating scan and charging fare...";
  try {
    const result = await request(`/api/tickets/${state.activeTicket.id}/tap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: state.pendingPayment.mode,
        station_name: state.pendingPayment.station_name,
        fare_thb: state.pendingPayment.fare_thb,
      }),
    });
    renderTicket(result.ticket);
    $("#paymentMessage").textContent = `Paid ${result.tap.charged_thb} THB. Saved ${result.saved_thb} THB from the cap.`;
    resetTicketView();
    setTimeout(closeSheets, 900);
  } catch (error) {
    $("#paymentMessage").textContent = error.message;
  }
}

function resetTicketView() {
  const shell = document.querySelector(".ticket-shell");
  shell.classList.remove("flipped");
  $("#tapToUseBtn").textContent = state.lang === "th" ? "แตะเพื่อใช้บัตร" : "Tap to Use";
  state.countdownSeconds = 299;
}

async function loadActiveTrip() {
  if (!state.user) return;
  try {
    state.activeTrip = await request("/api/trips/active");
  } catch {
    state.activeTrip = null;
  }
}

function plannedModesForCurrentRoute() {
  if (state.mode === "bus") return ["bus", "bus"];
  if (state.mode === "boat") return ["rail", "boat", "walk"];
  return ["rail", "bus", "boat"];
}

function demoLegFor(mode, index) {
  const dest = currentDestination();
  const origin = currentOrigin();
  const byMode = {
    rail: {
      mode: "rail",
      operator_label: "Rail gate validator",
      vehicle_id: origin.node,
      stop_label: index === 0 ? `${origin.node} entry` : `${dest.node} exit`,
      raw_fare_thb: 32,
    },
    bus: {
      mode: "bus",
      operator_label: "EV feeder bus validator",
      vehicle_id: `Tourist Feeder ${dest.id.toUpperCase().slice(0, 3)}-${index + 1}`,
      stop_label: `${localName(dest)} feeder stop`,
      raw_fare_thb: 16,
    },
    boat: {
      mode: "boat",
      operator_label: "River pier staff scanner",
      vehicle_id: "Chao Phraya EV Boat",
      stop_label: dest.node,
      raw_fare_thb: 21,
    },
    walk: {
      mode: "walk",
      operator_label: "Arrival checkpoint",
      vehicle_id: "No vehicle",
      stop_label: `${localName(dest)} entrance`,
      raw_fare_thb: 0,
    },
  };
  return byMode[mode] || byMode.bus;
}

async function startTripSession() {
  if (!state.user) {
    $("#tripStatus").textContent = "Sign in first so the trip can attach to a tourist wallet.";
    openAuthSheet();
    return;
  }
  if (!state.activeTicket) {
    $("#tripStatus").textContent = "Issue a ticket first, then start the testable trip session.";
    return;
  }
  const origin = currentOrigin();
  const dest = currentDestination();
  $("#tripStatus").textContent = "Starting trip session...";
  try {
    state.activeTrip = await request("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket_id: state.activeTicket.id,
        origin: origin.en,
        destination: dest.en,
        planned_modes: plannedModesForCurrentRoute(),
        estimated_fare_thb: routeModes[state.mode].total,
        fare_cap_thb: 45,
      }),
    });
    renderTripSession();
  } catch (error) {
    $("#tripStatus").textContent = error.message;
  }
}

async function simulateNextLeg() {
  if (!state.activeTrip) {
    $("#tripStatus").textContent = "Start a trip session first.";
    return;
  }
  const nextMode = state.activeTrip.planned_modes[state.activeTrip.scans.length] || state.activeTrip.planned_modes.at(-1);
  const payload = demoLegFor(nextMode, state.activeTrip.scans.length);
  $("#tripStatus").textContent = `Scanning ${payload.mode} leg...`;
  try {
    state.activeTrip = await request(`/api/trips/${state.activeTrip.id}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    renderTripSession();
  } catch (error) {
    $("#tripStatus").textContent = error.message;
  }
}

async function endTripSession() {
  if (!state.activeTrip) {
    $("#tripStatus").textContent = "No active trip to close.";
    return;
  }
  $("#tripStatus").textContent = "Closing trip and charging wallet...";
  try {
    const payment = await request(`/api/trips/${state.activeTrip.id}/end`, { method: "POST" });
    state.activeTrip = null;
    state.user.balance_thb = payment.balance_thb;
    $("#walletBalance").textContent = payment.balance_thb;
    $("#tripStatus").textContent = `Trip paid: ${payment.charged_thb} THB. Wallet updated, ticket QR reset for the next journey.`;
    resetTicketView();
    renderTripSession(payment.trip);
  } catch (error) {
    $("#tripStatus").textContent = error.message;
  }
}

function renderTripSession(overrideTrip) {
  const trip = overrideTrip || state.activeTrip;
  if (!trip) {
    $("#tripTimeline").innerHTML = "";
    $("#tripStatus").textContent = state.user ? t("noTripYet") : (state.lang === "th" ? "เข้าสู่ระบบเพื่อสร้างทริปทดสอบจริง" : "Sign in to create a real test session.");
    return;
  }
  const paid = trip.status === "paid";
  $("#tripStatus").textContent = paid
    ? (state.lang === "th" ? `จ่ายแล้ว ${trip.total_charged_thb}/45 บาท ${trip.anomaly_flags ? `มี flag ตรวจสอบ ${trip.anomaly_flags} จุด` : "ไม่มี flag ตรวจสอบ"}` : `Paid trip ${trip.total_charged_thb}/45 THB. ${trip.anomaly_flags ? `${trip.anomaly_flags} review flag(s).` : "No review flags."}`)
    : (state.lang === "th" ? `ทริปไป ${trip.destination}: คิดเงินแล้ว ${trip.total_charged_thb}/45 บาท จาก ${trip.scans.length} การสแกน` : `Active trip to ${trip.destination}: ${trip.total_charged_thb}/45 THB charged across ${trip.scans.length} scan(s).`);
  $("#tripTimeline").innerHTML = trip.scans.length
    ? trip.scans.map((scan) => `
      <div class="rounded-2xl border ${scan.is_expected ? "border-slate-100" : "border-amber-200 bg-amber-50"} p-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-black text-transit-ink">#${scan.sequence_no} ${scan.mode.toUpperCase()} · ${escapeHtml(scan.stop_label)}</p>
          <p class="text-sm font-black text-transit-teal">${scan.charged_thb} THB</p>
        </div>
        <p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(scan.operator_label)} · raw ${scan.raw_fare_thb} THB · ${escapeHtml(scan.vehicle_id || "verified validator")}</p>
        ${scan.anomaly_reason ? `<p class="mt-2 text-xs font-black text-amber-700">${escapeHtml(scan.anomaly_reason)}</p>` : ""}
      </div>
    `).join("")
    : `<div class="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">${state.lang === "th" ? 'เริ่มทริปแล้ว กด "สแกนช่วงถัดไป" เพื่อจำลอง gate รถไฟ เครื่องสแกนบนรถ หรือเจ้าหน้าที่ท่าเรือ' : 'Trip started. Press "Scan next leg" to simulate the first gate, bus validator, or pier staff scan.'}</div>`;
}

async function submitReport(event) {
  event.preventDefault();
  const form = event.currentTarget;
  $("#message").textContent = "Submitting report...";
  try {
    const dest = currentDestination();
    form.elements.latitude.value = dest.lat;
    form.elements.longitude.value = dest.lng;
    const payload = await request("/api/reports", { method: "POST", body: new FormData(form) });
    form.reset();
    $("#message").textContent = `Report submitted: ${payload.id.slice(0, 8).toUpperCase()}. Ops can review it in the dashboard.`;
  } catch (error) {
    $("#message").textContent = error.message;
  }
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  const payload = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(payload.detail || "Request failed");
  return payload;
}

function startCountdown() {
  setInterval(() => {
    state.countdownSeconds = state.countdownSeconds <= 0 ? 299 : state.countdownSeconds - 1;
    const m = String(Math.floor(state.countdownSeconds / 60)).padStart(2, "0");
    const s = String(state.countdownSeconds % 60).padStart(2, "0");
    $("#ticketCountdown").textContent = `Valid for ${m}:${s}`;
  }, 1000);
}

function openAuthSheet() {
  openSheet("#authSheet");
}

function openAiSheet() {
  openSheet("#aiSheet");
}

function openReportSheet() {
  openSheet("#reportSheet");
}

function openSheet(selector) {
  closeSheets(false);
  $(selector).classList.add("open");
  $("#sheetOverlay").classList.remove("pointer-events-none", "bg-slate-950/0");
  $("#sheetOverlay").classList.add("bg-slate-950/35");
}

function closeSheets(hideOverlay = true) {
  $$(".bottom-sheet").forEach((sheet) => sheet.classList.remove("open"));
  if (hideOverlay) {
    $("#sheetOverlay").classList.add("pointer-events-none", "bg-slate-950/0");
    $("#sheetOverlay").classList.remove("bg-slate-950/35");
  }
}

async function sendChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const value = input.value.trim();
  if (!value) return;
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="ml-auto max-w-[86%] rounded-3xl rounded-br-md bg-transit-teal px-4 py-3 text-sm font-semibold leading-6 text-white">${escapeHtml(value)}</div>`);
  input.value = "";
  $("#chatLog").insertAdjacentHTML("beforeend", `<div id="typingBubble" class="max-w-[86%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm font-semibold leading-6 text-slate-500">Thinking with route context...</div>`);
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  try {
    const answer = await request("/api/copilot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copilotPayload(value)),
    });
    $("#typingBubble").remove();
    appendAiAnswer(answer.answer, answer.suggestions);
  } catch (error) {
    $("#typingBubble").remove();
    appendAiAnswer(error.message, []);
  }
}

function copilotPayload(question) {
  return {
    question,
    language: state.lang,
    destination: currentDestination().en,
    mode: state.mode,
    fare_billed_thb: state.activeTicket?.accumulated_fare_thb || 0,
    fare_cap_thb: state.activeTicket?.fare_cap_thb || 45,
  };
}

function appendAiAnswer(answer, suggestionsList) {
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="max-w-[86%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">${escapeHtml(answer).replace(/\n/g, "<br>")}</div>`);
  if (suggestionsList?.length) {
    $("#chatLog").insertAdjacentHTML("beforeend", `<div class="flex max-w-[92%] flex-wrap gap-2">${suggestionsList.map((item) => `<button class="suggestion rounded-full bg-white px-3 py-2 text-xs font-black text-transit-teal shadow-sm" data-prompt="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div>`);
  }
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}

function askSuggested(prompt) {
  openAiSheet();
  $("#chatInput").value = prompt;
  $("#chatForm").requestSubmit();
}

function renderQuickPrompts() {
  const prompts = state.lang === "th"
    ? ["ฉันหลงทางระหว่างต่อรถ ควรทำยังไง?", "ช่วย audit ค่าโดยสารของทริปนี้ให้หน่อย", "ช่วยร่างรายงาน QR สแกนไม่ได้ที่ท่าเรือ", "ถึงปลายทางแล้วออกทางไหน?"]
    : ["I am lost during transfer. What should I do?", "Audit the fare for this trip", "Draft a QR scan failure report at the pier", "Which exit should I use after arrival?"];
  $("#quickPrompts").innerHTML = prompts.map((prompt) => `<button data-prompt="${escapeHtml(prompt)}" class="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">${escapeHtml(prompt)}</button>`).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

async function loadExistingTicket() {
  if (!state.activeTicketId) return;
  try {
    renderTicket(await request(`/api/tickets/${state.activeTicketId}`));
  } catch {
    localStorage.removeItem("activeTicketId");
  }
}

fillSelects();
wireEvents();
applyLanguage();
initMap();
startCountdown();
loadMe();
loadExistingTicket();
