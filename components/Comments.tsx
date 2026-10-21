"use client";

import { usePathname } from 'next/navigation';
import LocalComments from './LocalComments';

/** 文章/页面评论区：站内自建留言板，按当前路径分组。 */
export default function Comments() {
  const pathname = usePathname();
  return <LocalComments pageKey={pathname || '/'} />;
}
