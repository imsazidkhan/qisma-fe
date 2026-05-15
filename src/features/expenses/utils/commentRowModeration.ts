/** Whether Edit/Delete should be offered for an expense comment row. */
export function canModerateExpenseCommentRow(
  commentAuthorUserId: string,
  currentUserId: string,
  isModerator: boolean,
): boolean {
  return commentAuthorUserId === currentUserId || isModerator;
}
