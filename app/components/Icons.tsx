
// 排球图标 - 可爱卡通风格带笑脸
export function VolleyballIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
      <svg
          className={className}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
      >
        {/* 球体底色 - 浅粉色边缘（加粗） */}
        <circle cx="100" cy="100" r="95" fill="#FFB6D9"/>

        {/* 球体主色 - 混合底色 */}
        <defs>
          <radialGradient id="volleyballGradient" cx="100" cy="100" r="90">
            <stop offset="0%" stopColor="#FFF5E6"/>
            <stop offset="25%" stopColor="#FFE4B5"/>
            <stop offset="50%" stopColor="#FFD93D"/>
            <stop offset="75%" stopColor="#FFB6D9"/>
            <stop offset="100%" stopColor="#FF9F5A"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#volleyballGradient)"/>

        {/* 黄色面板 - 右上部分 */}
        <path
            d="M100 8
           C125 8, 148 20, 163 42
           C175 62, 178 85, 172 107
           C155 105, 138 102, 122 98
           C110 85, 102 70, 98 55
           C95 40, 96 25, 100 8Z"
            fill="#FFD93D"
            opacity="0.8"
        />

        {/* 黄色面板 - 右侧中间 */}
        <path
            d="M172 107
           C175 125, 172 143, 163 158
           C148 175, 128 185, 107 188
           C105 170, 107 152, 113 135
           C120 120, 132 108, 148 102
           C158 102, 165 103, 172 107Z"
            fill="#FFD93D"
            opacity="0.7"
        />

        {/* 橙色面板 - 左侧大部分 */}
        <path
            d="M28 107
           C22 85, 25 62, 37 42
           C52 20, 75 8, 100 8
           C96 25, 95 40, 98 55
           C102 70, 110 85, 122 98
           C115 115, 105 130, 92 142
           C75 145, 58 147, 42 145
           C33 135, 28 121, 28 107Z"
            fill="#FF9F5A"
            opacity="0.8"
        />

        {/* 橙色面板 - 底部 */}
        <path
            d="M107 188
           C85 185, 65 175, 50 158
           C42 148, 36 137, 32 125
           C45 130, 58 133, 72 135
           C85 145, 95 158, 102 173
           C105 180, 106 184, 107 188Z"
            fill="#FF9F5A"
            opacity="0.7"
        />

        {/* 粉色面板 - 右侧边缘 */}
        <path
            d="M163 42
           C178 62, 185 85, 185 107
           C185 125, 178 143, 163 158
           C172 143, 175 125, 172 107
           C172 85, 168 65, 163 42Z"
            fill="#FF85C0"
            opacity="0.6"
        />

        {/* 白色面板 - 左上部分 */}
        <path
            d="M100 8
           C75 8, 52 20, 37 42
           C30 55, 26 70, 28 85
           C40 88, 52 90, 65 90
           C78 80, 88 68, 95 55
           C100 40, 101 25, 100 8Z"
            fill="white"
            opacity="0.6"
        />

        {/* 白色面板 - 左下部分 */}
        <path
            d="M28 107
           C28 121, 33 135, 42 145
           C48 152, 56 158, 65 162
           C60 150, 58 137, 60 124
           C55 117, 45 112, 35 110
           C32 109, 30 108, 28 107Z"
            fill="white"
            opacity="0.5"
        />

        {/* 粉色面板 - 左侧边缘 */}
        <path
            d="M37 42
           C25 62, 18 85, 18 107
           C18 125, 25 143, 40 158
           C33 145, 28 130, 28 115
           C28 95, 32 75, 37 58
           C37 52, 37 47, 37 42Z"
            fill="#FFB6D9"
            opacity="0.5"
        />

        {/* 螺旋装饰线 */}
        <circle
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.4"
        />

        {/* 放大版笑脸 */}
        {/* 左眼 */}
        <ellipse cx="80" cy="85" rx="7" ry="8" fill="#1F2937"/>

        {/* 右眼 */}
        <ellipse cx="120" cy="85" rx="7" ry="8" fill="#1F2937"/>

        {/* 左腮红 */}
        <ellipse cx="65" cy="100" rx="12" ry="8" fill="#FFB6D9" opacity="0.8"/>

        {/* 右腮红 */}
        <ellipse cx="135" cy="100" rx="12" ry="8" fill="#FFB6D9" opacity="0.8"/>

        {/* 微笑嘴巴 */}
        <path
            d="M80 105
           Q100 125, 120 105"
            stroke="#1F2937"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
        />

        {/* 装饰星星 - 左下黄色 */}
        <polygon
            points="50,135 53,143 62,143 55,149 57,157 50,152 43,157 45,149 38,143 47,143"
            fill="#FFD93D"
        />

        {/* 装饰星星 - 右侧橙色 */}
        <polygon
            points="155,70 158,78 167,78 160,84 162,92 155,87 148,92 150,84 143,78 152,78"
            fill="#FF9F5A"
        />

        {/* 装饰星星 - 左侧橙色 */}
        <polygon
            points="35,115 37,120 42,120 38,124 40,129 35,126 30,129 32,124 28,120 33,120"
            fill="#FF9F5A"
        />

        {/* 装饰星星 - 顶部白色 */}
        <polygon
            points="95,25 97,30 102,30 98,34 100,39 95,36 90,39 92,34 88,30 93,30"
            fill="white"
        />

        {/* 装饰星星 - 右下粉色 */}
        <polygon
            points="165,145 167,150 172,150 168,154 170,159 165,156 160,159 162,154 158,150 163,150"
            fill="#FFB6D9"
        />

        {/* 球体高光 */}
        <ellipse cx="75" cy="45" rx="18" ry="14" fill="white" opacity="0.8"/>
      </svg>
  );
}

// ... existing code ...



// 日历/赛事图标 - TODO 清单风格
export function CalendarIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 纸张外框 */}
      <rect
        x="15"
        y="10"
        width="70"
        height="80"
        rx="3"
        fill="#FEF3C7"
        stroke="#374151"
        strokeWidth="3"
      />
      
      {/* VOLLEYBALL 标题 */}
      <text
        x="50"
        y="26"
        textAnchor="middle"
        fill="#374151"
        fontSize="8"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        VOLLEYBALL
      </text>
      
      {/* 第一条复选框和横线 */}
      <rect
        x="23"
        y="36"
        width="8"
        height="8"
        rx="1.5"
        fill="white"
        stroke="#374151"
        strokeWidth="2.5"
      />
      <line
        x1="36"
        y1="40"
        x2="72"
        y2="40"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* 第二条复选框和横线 */}
      <rect
        x="23"
        y="50"
        width="8"
        height="8"
        rx="1.5"
        fill="white"
        stroke="#374151"
        strokeWidth="2.5"
      />
      <line
        x1="36"
        y1="54"
        x2="72"
        y2="54"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* 第三条复选框和横线 */}
      <rect
        x="23"
        y="64"
        width="8"
        height="8"
        rx="1.5"
        fill="white"
        stroke="#374151"
        strokeWidth="2.5"
      />
      <line
        x1="36"
        y1="68"
        x2="72"
        y2="68"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* 铅笔 */}
      <g transform="translate(58, 60) rotate(-35)">
        {/* 笔身 */}
        <rect
          x="0"
          y="0"
          width="10"
          height="28"
          rx="1"
          fill="#FCD34D"
          stroke="#374151"
          strokeWidth="2"
        />
        {/* 笔尖木质部分 */}
        <path
          d="M0 24 L5 28 L10 24 L10 28 L5 32 L0 28 Z"
          fill="#DEB88B"
          stroke="#374151"
          strokeWidth="2"
        />
        {/* 笔芯 */}
        <path
          d="M4 28 L5 32 L6 28 Z"
          fill="#1F2937"
          stroke="none"
        />
        {/* 橡皮擦 */}
        <rect
          x="1"
          y="-3"
          width="8"
          height="6"
          rx="1"
          fill="#FCA5A5"
          stroke="#374151"
          strokeWidth="2"
        />
        {/* 金属环 */}
        <rect
          x="1"
          y="2"
          width="8"
          height="3"
          fill="#9CA3AF"
          stroke="#374151"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

// 用户/球友图标 - 手拉手小人风格
export function UsersIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 左边小人 */}
      {/* 头部 */}
      <circle
        cx="35"
        cy="30"
        r="14"
        fill="white"
        stroke="#1F2937"
        strokeWidth="3"
      />
      
      {/* 眼睛 */}
      <circle cx="31" cy="28" r="2" fill="#1F2937"/>
      <circle cx="39" cy="28" r="2" fill="#1F2937"/>
      
      {/* 嘴巴（微笑） */}
      <path
        d="M31 34 Q35 38, 39 34"
        stroke="#1F2937"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* 身体 */}
      <path
        d="M35 44 L35 65"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 左臂（向外） */}
      <path
        d="M35 50 L20 60"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 右臂（向右下拉手） */}
      <path
        d="M35 50 L45 58"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 左腿 */}
      <path
        d="M35 65 L25 88"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 右腿 */}
      <path
        d="M35 65 L45 88 "
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 右边小人 */}
      {/* 头部 */}
      <circle
        cx="65"
        cy="30"
        r="14"
        fill="white"
        stroke="#1F2937"
        strokeWidth="3"
      />
      
      {/* 眼睛 */}
      <circle cx="61" cy="28" r="2" fill="#1F2937"/>
      <circle cx="69" cy="28" r="2" fill="#1F2937"/>
      
      {/* 嘴巴（微笑） */}
      <path
        d="M61 34 Q65 38, 69 34"
        stroke="#1F2937"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* 身体 */}
      <path
        d="M65 44 L65 65"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 左臂（向左下拉手） */}
      <path
        d="M65 50 L55 58"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 右臂（向外） */}
      <path
        d="M65 50 L80 60"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 左腿 */}
      <path
        d="M65 65 L55 88"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 右腿 */}
      <path
        d="M65 65 L75 88"
        stroke="#1F2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* 握手部分 - 在中间 */}
      <circle
        cx="50"
        cy="62"
        r="4"
        fill="white"
        stroke="#1F2937"
        strokeWidth="2.5"
      />
    </svg>
  );
}

// 花朵图标
export function FlowerIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="50" cy="25" rx="10" ry="20" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
      <ellipse cx="75" cy="50" rx="20" ry="10" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
      <ellipse cx="50" cy="75" rx="10" ry="20" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
      <ellipse cx="25" cy="50" rx="20" ry="10" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2"/>
      <circle cx="50" cy="50" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
    </svg>
  );
}

// 星星图标
export function StarIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 5 L61 35 L95 35 L68 55 L79 85 L50 65 L21 85 L32 55 L5 35 L39 35 Z"
        fill="#FFD700"
        stroke="#FFA500"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 加载动画图标 - 简笔画垫排球小人
export function LoadingIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={`${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 定义动画 */}
      <defs>
        <style>
          {`
            @keyframes bump {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(-5deg); }
            }
            @keyframes ball-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .person-animation {
              animation: bump 1s ease-in-out infinite;
            }
            .ball-animation {
              animation: ball-spin 3s linear infinite;
              transform-origin: 140px 50px;
            }
          `}
        </style>
      </defs>
      
      {/* 人物组 - 整体上下移动 */}
      <g className="person-animation">
        {/* 头部 */}
        <circle cx="80" cy="60" r="20" stroke="#1F2937" strokeWidth="4" fill="white"/>
        
        {/* 头发 */}
        <path
          d="M60 50 Q70 35, 80 38 Q90 35, 100 50"
          fill="#1F2937"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 眼睛 */}
        <circle cx="75" cy="58" r="2.5" fill="#1F2937"/>
        <circle cx="85" cy="58" r="2.5" fill="#1F2937"/>
        
        {/* 嘴巴（微笑） */}
        <path
          d="M75 68 Q80 72, 85 68"
          stroke="#1F2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* 身体 */}
        <path
          d="M80 80 L80 130"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 左腿（弯曲） */}
        <path
          d="M80 130 L60 160 L55 180"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 右腿（前伸） */}
        <path
          d="M80 130 L110 155 L130 160"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 左手臂（前伸垫球） */}
        <path
          d="M80 95 L120 110 L135 115"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 右手臂（前伸垫球） */}
        <path
          d="M80 100 L115 118 L130 123"
          stroke="#1F2937"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 双手握在一起 */}
        <circle cx="135" cy="118" r="6" fill="#1F2937"/>
      </g>
      
      {/* 排球 - 旋转动画 */}
      <g className="ball-animation">
        {/* 球体底色 */}
        <circle cx="140" cy="50" r="25" fill="white" stroke="#1F2937" strokeWidth="4"/>
        
        {/* 第一条螺旋曲线 - 左侧黄色 */}
        <path
          d="M120 38 C125 30, 132 27, 140 28 C148 29, 153 35, 155 42"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M120 38 C115 45, 113 53, 115 60 C117 67, 123 72, 130 72"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
        />
        
        {/* 第二条螺旋曲线 - 右侧黄色 */}
        <path
          d="M155 42 C160 50, 162 58, 160 65 C158 70, 152 73, 145 73"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
        />
        
        {/* 横向曲线 */}
        <path
          d="M115 50 C125 47, 135 45, 145 47 C152 49, 158 53, 163 58"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M117 58 C127 55, 137 53, 147 55 C154 57, 160 61, 163 65"
          stroke="#1F2937"
          strokeWidth="3"
          fill="none"
        />
        
        {/* 填充黄色区域 */}
        <path
          d="M120 38 C125 30, 132 27, 140 28 L140 35 C133 34, 127 37, 123 43 Z"
          fill="#FCD34D"
          stroke="none"
        />
        <path
          d="M155 42 C160 50, 162 58, 160 65 L153 63 C154 57, 152 50, 148 44 Z"
          fill="#FCD34D"
          stroke="none"
        />
        
        {/* 填充蓝色区域 */}
        <path
          d="M130 72 C123 72, 117 67, 115 60 L122 60 C123 65, 127 69, 132 70 Z"
          fill="#60A5FA"
          stroke="none"
        />
        <path
          d="M145 73 C152 73, 158 70, 160 65 L153 65 C151 68, 147 70, 143 70 Z"
          fill="#60A5FA"
          stroke="none"
        />
        
        {/* 外轮廓 */}
        <circle cx="140" cy="50" r="25" fill="none" stroke="#1F2937" strokeWidth="4"/>
      </g>
      
      {/* 运动轨迹线 */}
      <path
        d="M130 125 Q135 135, 140 140"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.6"
      />
    </svg>
  );
}
