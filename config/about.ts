import { LucideIcon, Info, Github, Coffee } from 'lucide-react';

export interface AboutConfig {
  version: string;
  developer: {
    name: string;
    role: string;
    avatar: string;
  };
  backgroundCharacter: {
    name: string;
    description: string;
  };
  links: {
    icon: LucideIcon;
    title: string;
    description: string;
    url: string;
    iconColorClass?: string;
  }[];
}

export const ABOUT_CONFIG: AboutConfig = {
  version: 'Beta Ver',
  developer: {
    name: 'Nako Arkrin',
    role: '开发者与设计师',
    avatar: '/author-avatar.jpg'
  },
  backgroundCharacter: {
    name: '浅羽悠真',
    description: '手游《绝区零》角色，隶属于“对空六课”。他外表随性、态度慵懒，说话总带点漫不经心的吐槽感，看起来像个不太靠谱的摸鱼社畜。但真正进入战斗时，他却展现出极强的判断力与执行力，是实力在线的电属性输出角色。典型的“平时不想干活，关键时刻最能打”的反差型人物。'
  },
  links: [
    {
      icon: Github,
      title: '了解 Rino Nako 仓库',
      description: '为我们的项目提供建议。',
      url: 'https://github.com/RinoNako',
      iconColorClass: 'text-gray-700'
    },
    {
      icon: Coffee,
      title: '请开发者喝杯咖啡',
      description: '为 Rino Nako 提供支持！',
      url: '#', // TODO: Add donation link
      iconColorClass: 'text-orange-500'
    }
  ]
};
