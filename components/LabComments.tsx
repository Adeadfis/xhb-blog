"use client";

import { usePathname } from 'next/navigation';
import LocalComments from './LocalComments';

/** 实验室评论区：站内自建留言板。 */
export default function LabComments({ pageId }: { pageId?: string }) {
  const pathname = usePathname();
  return <LocalComments pageKey={pageId || pathname || '/lab'} />;
}
