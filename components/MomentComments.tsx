"use client";

import LocalComments from './LocalComments';

/**
 * 说说下面的评论区。
 * 原来是 Gitalk（需要 GitHub 登录），现在换成站内自建留言板，游客直接留名即可。
 */
export default function MomentComments({ id }: { id: string }) {
  return <LocalComments pageKey={id} />;
}
