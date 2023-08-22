import React, { useContext, useEffect, useRef, useState } from 'react';

import '../createPost/createPostDialog.css';
import UserContext from '../../../contexts/UserContext';
import { lmFeedClient } from '../../..';
import { DecodeUrlModelSX } from '../../../services/models';
import { IPost } from 'likeminds-sdk';

interface CreatePostDialogProps {
  dialogBoxRef?: React.RefObject<HTMLDivElement>; // Replace "HTMLElement" with the actual type of the ref
  closeCreatePostDialog: () => void;
  //   showMediaAttachmentOnInitiation: boolean;
  //   setShowMediaAttachmentOnInitiation: React.Dispatch<React.SetStateAction<boolean>>;
  setFeedArray: React.Dispatch<React.SetStateAction<IPost[]>>;
  feedArray: IPost[];
  post: IPost | null;
}
interface Limits {
  left: number;
  right: number;
}
export interface TagInfo {
  tagString: string;
  limitLeft: number;
  limitRight: number;
}

export const getCaretPosition = (): number => {
  const selection = window.getSelection();
  const editableDiv = selection?.focusNode as Node;
  let caretPos = 0;
  if (window.getSelection()) {
    if (selection?.rangeCount && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableDiv);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretPos = preCaretRange.toString().length;
    }
  }
  return caretPos;
};

export function findSpaceAfterIndex(str: string, index: number): number {
  if (index < 0 || index >= str.length) {
    throw new Error('Invalid index');
  }
  let pos = -1;
  for (let i = index + 1; i < str.length; i++) {
    if (str[i] === ' ') {
      pos = i - 1;
      break;
    } else if (str[i] === '@') {
      pos = i - 1;
      break;
    }
  }
  if (pos === -1) {
    return str.length - 1;
  } else {
    return pos;
  }
}

export function checkAtSymbol(str: string, index: number): number {
  if (index < 0 || index >= str.length) {
    throw new Error('Invalid index');
  }
  let pos = -1;
  for (let i = index; i >= 0; i--) {
    if (str[i] === '@') {
      pos = i;
      break;
    }
  }
  if (pos === -1) {
    return -1;
  } else if (pos === 0) {
    return 1;
  } else if (pos > 0 && /\s/.test(str[pos - 1])) {
    return pos + 1;
  } else {
    return -1;
  }
}

const EditPost = ({
  closeCreatePostDialog,

  setFeedArray,
  feedArray,
  post
}: CreatePostDialogProps) => {
  const userContext = useContext(UserContext);
  function setUserImage() {
    const imageLink = userContext?.user?.imageUrl;
    if (imageLink !== '') {
      return (
        <img
          src={imageLink}
          alt={userContext.user?.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%'
          }}
        />
      );
    } else {
      return (
        <span
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'gray',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          {userContext.user?.name?.split(' ').map((part: string) => {
            return part.charAt(0)?.toUpperCase();
          })}
        </span>
      );
    }
  }
  const [text, setText] = useState<string>('');
  const [showMediaUploadBar, setShowMediaUploadBar] = useState<null | boolean>(true);
  const [showInitiateUploadComponent, setShowInitiateUploadComponent] = useState<boolean>(false);
  const [imageOrVideoUploadArray, setImageOrVideoUploadArray] = useState<null | File[]>(null);
  const [documentUploadArray, setDocumentUploadArray] = useState<null | File[]>(null);
  const [attachmentType, setAttachmentType] = useState<null | number>(0);
  const [showOGTagPreview, setShowOGTagPreview] = useState<boolean>(false);
  const [previewOGTagData, setPreviewOGTagData] = useState<DecodeUrlModelSX | null>(null);
  const [hasPreviewClosedOnce, setHasPreviewClosedOnce] = useState<boolean>(false);
  const [limits, setLimits] = useState<Limits>({
    left: 0,
    right: 0
  });
  const [tagString, setTagString] = useState('');
  const [taggingMemberList, setTaggingMemberList] = useState<any[] | null>(null);
  const contentEditableDiv = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (contentEditableDiv.current) {
      contentEditableDiv.current.innerHTML = convertTextToHTML(post?.text!).innerHTML;
    }
  }, []);
  interface MatchPattern {
    type: number;
    displayName?: string;
    routeId?: string;
    link?: string;
  }
  function convertTextToHTML(text: string) {
    const regex = /<<.*?>>|(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*|www\.[^\s/$.?#].[^\s]*/g;
    const matches = text.match(regex) || [];
    const splits = text.split(regex);

    const container = document.createElement('div');

    for (let i = 0; i < splits.length; i++) {
      const splitNode = document.createTextNode(splits[i]);
      container.appendChild(splitNode);

      if (matches[i]) {
        const text = matches[i];
        const getInfoPattern = /<<([^|]+)\|([^>>]+)>>/;
        const match = text.match(getInfoPattern);
        const userObject: MatchPattern = {
          type: 1
        };
        if (match) {
          const userName = match[1];
          const userId = match[2];
          userObject.displayName = userName;
          userObject.routeId = userId;
        } else {
          userObject.type = 2;
          userObject.link = text;
        }
        if (userObject.type === 1) {
          const matchText = matches[i].slice(2, -2); // Remove '<<' and '>>'
          const linkNode = document.createElement('a');
          linkNode.href = '#'; // You can set the appropriate URL here
          linkNode.textContent = userObject.displayName!;
          linkNode.id = userObject.routeId!;
          container.appendChild(linkNode);
        } else {
          const linkNode = document.createElement('a');
          linkNode.href = userObject.link!; // You can set the appropriate URL here
          linkNode.textContent = userObject.link!;
          container.appendChild(linkNode);
        }
      }
    }

    return container;
  }
  const attachmentProps = {
    showMediaUploadBar,
    setShowMediaUploadBar,
    imageOrVideoUploadArray,
    setImageOrVideoUploadArray,
    documentUploadArray,
    setDocumentUploadArray,
    attachmentType,
    setAttachmentType,
    showInitiateUploadComponent,
    setShowInitiateUploadComponent,
    showOGTagPreview,
    setShowOGTagPreview,
    previewOGTagData,
    setPreviewOGTagData,
    hasPreviewClosedOnce,
    setHasPreviewClosedOnce
    // showMediaAttachmentOnInitiation
  };

  const setCloseDialog = () => {};
  function findTag(str: string): TagInfo | undefined {
    if (str.length === 0) {
      return undefined;
    }
    const cursorPosition = getCaretPosition();
    // // console.log ("the cursor position is: ", cursorPosition)
    const leftLimit = checkAtSymbol(str, cursorPosition - 1);
    if (leftLimit === -1) {
      setCloseDialog(); // Assuming this function is defined somewhere else and handled separately.
      return undefined;
    }
    const rightLimit = findSpaceAfterIndex(str, cursorPosition - 1);
    // // console.log ("the right limit is :", rightLimit)
    const substr = str.substring(leftLimit, rightLimit + 1);
    setLimits({
      left: leftLimit,
      right: rightLimit
    });

    return {
      tagString: substr,
      limitLeft: leftLimit,
      limitRight: rightLimit
    };
  }

  function resetContext() {
    setShowMediaUploadBar(true);
    setImageOrVideoUploadArray(null);
    setDocumentUploadArray(null);
    if (contentEditableDiv.current) {
      const nodes = contentEditableDiv.current.childNodes;
      while (nodes.length) {
        const el = nodes[0];
        contentEditableDiv.current.removeChild(el);
      }
    }
    setText('');
    setAttachmentType(null);
    setShowInitiateUploadComponent(false);
    // setShowMediaAttachmentOnInitiation(false);
  }

  async function postFeed() {
    try {
      let textContent = extractTextFromNode(contentEditableDiv.current);
      console.log(textContent);
      console.log(textContent.length);
      closeDialogBox();
      let response: any;
      if (previewOGTagData !== null) {
        response = await lmFeedClient.addPostWithOGTags(text, previewOGTagData);
      } else {
        response = await lmFeedClient.editPost(post?.Id!, textContent);
      }
      const newpost: IPost = response?.data?.post;
      const newFeedArray = [...feedArray];
      const thisFeedIndex = newFeedArray.findIndex((item: IPost) => item.Id === post?.Id!);
      newFeedArray[thisFeedIndex] = { ...newpost };
      setFeedArray(newFeedArray);
      //   setFeedArray([{ ...newpost }].concat([...feedArray]));
    } catch (error) {
      lmFeedClient.logError(error);
    }
  }
  async function checkForOGTags() {
    try {
      const ogTagLinkArray: string[] = lmFeedClient.detectLinks(text);
      // console.log (ogTagLinkArray);
      if (ogTagLinkArray.length) {
        const getOgTag: DecodeUrlModelSX = await lmFeedClient.decodeUrl(ogTagLinkArray[0]);
        // console.log ('the og tag call is :', getOgTag);
        setPreviewOGTagData(getOgTag);
        if (!hasPreviewClosedOnce) {
          setShowOGTagPreview(true);
        }
      }
    } catch (error) {
      // console.log (error);
    }
  }
  function closeDialogBox() {
    resetContext();
    closeCreatePostDialog();
  }

  function extractTextFromNode(node: any) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.nodeName === 'A') {
        let textContent: string = node.textContent;
        textContent = textContent.substring(1);
        const id = node.getAttribute('id');
        return `<<${textContent}|route://user_profile/${id}>>`;
      } else {
        let text = '';
        const childNodes = node.childNodes;

        for (const childNode of childNodes) {
          text += extractTextFromNode(childNode);
        }

        return text;
      }
    } else {
      return '';
    }
  }

  useEffect(() => {
    // console.log (imageOrVideoUploadArray);
  }, [imageOrVideoUploadArray]);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      checkForOGTags();
    }, 500);
    return () => {
      clearTimeout(timeOut);
    };
  }, [text]);

  useEffect(() => {
    if (!tagString && !(tagString.length > 0)) {
      return;
    }
    async function getTags() {
      const tagListResponse = await lmFeedClient.getTaggingList(tagString);

      const memberList = tagListResponse?.data?.members;
      console.log(memberList);
      if (memberList && memberList.length > 0) {
        console.log('setting tag member list');
        setTaggingMemberList(memberList);
      } else {
        console.log('setting tag member list  to null');
        setTaggingMemberList(null);
      }
    }
    const timeout = setTimeout(() => {
      getTags();
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [tagString]);
  return (
    // <div className="create-post-feed-dialog-wrapper">
    <div>
      <div className="create-post-feed-dialog-wrapper--container">
        <span
          className="create-post-feed-dialog-wrapper_container--closeicon"
          onClick={closeDialogBox}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.47755 20.5254C3.89943 20.9356 4.59084 20.9356 4.98927 20.5254L11.9971 13.5176L19.0049 20.5254C19.4151 20.9356 20.1065 20.9473 20.5166 20.5254C20.9268 20.1035 20.9385 19.4121 20.5283 19.002L13.5205 11.9942L20.5283 4.99806C20.9385 4.58791 20.9385 3.88478 20.5166 3.47462C20.0947 3.06447 19.4151 3.06447 19.0049 3.47462L11.9971 10.4824L4.98927 3.47462C4.59084 3.06447 3.88771 3.05275 3.47755 3.47462C3.0674 3.8965 3.0674 4.58791 3.47755 4.99806L10.4736 11.9942L3.47755 19.002C3.0674 19.4121 3.05568 20.1152 3.47755 20.5254Z"
              fill="#000000"
            />
          </svg>
        </span>
        <div className="create-post-feed-dialog-wrapper_container--post-wrapper">
          <div className="create-post-feed-dialog-wrapper_container_post-wrapper--heading">
            <span>Edit Post</span>
          </div>
          <div className="create-post-feed-dialog-wrapper_container_post-wrapper--user-info">
            <div className="create-post-feed-dialog-wrapper_container_post-wrapper_user-info--user-image">
              {setUserImage()}
            </div>
            <div className="create-post-feed-dialog-wrapper_container_post-wrapper_user-info--user-name">
              {userContext?.user?.name}
            </div>
          </div>
          <div className="create-post-feed-dialog-wrapper_container_post-wrapper--post-container">
            <div
              ref={contentEditableDiv}
              contentEditable={true}
              suppressContentEditableWarning
              tabIndex={0}
              placeholder="hello world"
              id="editableDiv"
              style={{
                width: '100%',
                height: 'auto',
                resize: 'none',
                border: 'none',
                fontWeight: '400',
                fontSize: '1rem',
                fontFamily: 'Roboto',
                overflowY: 'auto'
              }}
              onInput={(event: React.KeyboardEvent<HTMLDivElement>) => {
                setText(event.currentTarget.textContent!);
                const selection = window.getSelection();
                if (selection === null) return;
                let focusNode = selection.focusNode;
                if (focusNode === null) {
                  return;
                }
                let div = focusNode.parentElement;
                if (div === null) {
                  return;
                }
                let text = div.childNodes;
                if (focusNode === null || text.length === 0) {
                  return;
                }
                let textContentFocusNode = focusNode.textContent;

                let tagOp = findTag(textContentFocusNode!);
                if (
                  tagOp?.tagString !== null &&
                  tagOp?.tagString !== undefined &&
                  tagOp?.tagString !== ''
                ) {
                  setTagString(tagOp?.tagString!);
                }
              }}></div>
            {taggingMemberList && taggingMemberList?.length > 0 ? (
              <div
                style={{
                  maxHeight: '100px',
                  width: '250px',
                  overflowY: 'auto'
                }}>
                {taggingMemberList?.map!((item: any) => {
                  return (
                    <button
                      key={item?.id}
                      className="taggingTile"
                      style={{
                        background: 'white',
                        padding: '12px',
                        display: 'block',
                        border: 'none',
                        width: '250px',
                        textAlign: 'left'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        let focusNode = window.getSelection()!.focusNode;
                        if (focusNode === null) {
                          return;
                        }
                        let div = focusNode.parentElement;
                        let text = div!.childNodes;
                        if (focusNode === null || text.length === 0) {
                          return;
                        }
                        let textContentFocusNode = focusNode.textContent;
                        if (textContentFocusNode === null) {
                          return;
                        }
                        let tagOp = findTag(textContentFocusNode);
                        // console.log ('the tag string is ', tagOp!.tagString);
                        if (tagOp === undefined) return;
                        let substr = tagOp?.tagString;
                        const { limitLeft, limitRight } = tagOp;
                        if (!substr || substr.length === 0) {
                          return;
                        }
                        let textNode1Text = textContentFocusNode.substring(0, limitLeft - 1);
                        let textNode2Text = textContentFocusNode.substring(limitRight + 1);

                        let textNode1 = document.createTextNode(textNode1Text);
                        let anchorNode = document.createElement('a');
                        anchorNode.id = item?.id;
                        anchorNode.href = '#';
                        anchorNode.textContent = `@${item?.name.trim()}`;
                        anchorNode.contentEditable = 'false';
                        let textNode2 = document.createTextNode(textNode2Text);
                        div!.replaceChild(textNode2, focusNode);
                        div!.insertBefore(anchorNode, textNode2);
                        div!.insertBefore(textNode1, anchorNode);
                        setTaggingMemberList([]);
                      }}>
                      {item?.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div
            className="create-post-feed-dialog-wrapper_container_post-wrapper--send-post"
            onClick={postFeed}>
            Edit Post
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;