import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faPenToSquare,
  faRotateLeft,
  faTag,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import MainContainer from "../../shared/components/MainContainer";
import Modal from "../../shared/components/Modal";
import ConfirmModal from "../../shared/components/ConfirmModal";
import Tabs from "../../shared/components/Tabs";
import MarkdownRender from "../../shared/components/MarkdownRender";
import MarkdownEditor from "../../shared/components/MarkdownEditor";
import { Input } from "../../shared/components/controls/Input";
import { Button } from "../../shared/components/controls/Button";
import { cardRepository } from "../../repositories/CardRepository";
import { categoryTagRepository } from "../../repositories/CategoryTagRepository";
import { boxRepository } from "../../repositories/BoxRepository";
import type { CardPreviewDto } from "../../dtos/cardPreviewDto";
import type { Card, CategoryTag, Box } from "../../db/entities";
import styles from "./CardManagement.module.css";

const PAGE_SIZE = 20;

export default function CardManagement() {
  const [cards, setCards] = useState<CardPreviewDto[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState("");
  const [tags, setTags] = useState<CategoryTag[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [changeTagCardId, setChangeTagCardId] = useState<string | null>(null);
  const [changeTagNewId, setChangeTagNewId] = useState("");

  useEffect(() => {
    categoryTagRepository.getAll().then(setTags);
    boxRepository.getChainOrdered().then(setBoxes);
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    const tagParam = selectedTagId || undefined;
    const boxParam = selectedBoxId || undefined;
    let cancelled = false;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLoading(true);
    cardRepository.getAllPreview(1, PAGE_SIZE, tagParam, boxParam).then((result) => {
      if (cancelled) return;
      setCards(result);
      setHasMore(result.length === PAGE_SIZE);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedTagId, selectedBoxId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          pageRef.current += 1;
          const tagParam = selectedTagId || undefined;
          const boxParam = selectedBoxId || undefined;
          setLoading(true);
          const pageNum = pageRef.current;
          cardRepository.getAllPreview(pageNum, PAGE_SIZE, tagParam, boxParam).then((result) => {
            setCards((prev) => [...prev, ...result]);
            setHasMore(result.length === PAGE_SIZE);
            setLoading(false);
          });
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, selectedTagId, selectedBoxId]);

  useEffect(() => {
    if (!openDropdownId) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdownId]);

  const openEdit = async (cardId: string) => {
    setOpenDropdownId(null);
    const card = await cardRepository.getById(cardId);
    if (!card) return;
    setEditCard(card);
    setEditTitle(card.MarkdownTopic);
    setEditContent(card.MarkdownContent);
    setEditCardId(cardId);
  };

  const closeEdit = () => {
    setEditCardId(null);
    setEditCard(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSaveEdit = async () => {
    if (!editCard) return;
    await cardRepository.update({
      ...editCard,
      MarkdownTopic: editTitle,
      MarkdownContent: editContent,
    });
    closeEdit();
    pageRef.current = 1;
    const tagParam = selectedTagId || undefined;
    const boxParam = selectedBoxId || undefined;
    setLoading(true);
    cardRepository.getAllPreview(1, PAGE_SIZE, tagParam, boxParam).then((result) => {
      setCards(result);
      setHasMore(result.length === PAGE_SIZE);
      setLoading(false);
    });
  };

  const handleReset = async (cardId: string) => {
    setOpenDropdownId(null);
    await cardRepository.resetBox(cardId);
    pageRef.current = 1;
    const tagParam = selectedTagId || undefined;
    const boxParam = selectedBoxId || undefined;
    setLoading(true);
    cardRepository.getAllPreview(1, PAGE_SIZE, tagParam, boxParam).then((result) => {
      setCards(result);
      setHasMore(result.length === PAGE_SIZE);
      setLoading(false);
    });
  };

  const handleChangeTag = async () => {
    if (!changeTagCardId || !changeTagNewId) return;
    await cardRepository.updateCategoryTagId([changeTagCardId], changeTagNewId);
    setChangeTagCardId(null);
    setChangeTagNewId("");
    pageRef.current = 1;
    const tagParam = selectedTagId || undefined;
    const boxParam = selectedBoxId || undefined;
    setLoading(true);
    cardRepository.getAllPreview(1, PAGE_SIZE, tagParam, boxParam).then((result) => {
      setCards(result);
      setHasMore(result.length === PAGE_SIZE);
      setLoading(false);
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    await cardRepository.delete(deleteTargetId);
    setDeleteTargetId(null);
    pageRef.current = 1;
    const tagParam = selectedTagId || undefined;
    const boxParam = selectedBoxId || undefined;
    setLoading(true);
    cardRepository.getAllPreview(1, PAGE_SIZE, tagParam, boxParam).then((result) => {
      setCards(result);
      setHasMore(result.length === PAGE_SIZE);
      setLoading(false);
    });
  };

  const filteredCards = cards.filter((card) =>
    card.markdownTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <MainContainer>
      <h3 className={styles.pageHeading}>Manage Cards</h3>
      <div className={styles.filterRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={selectedTagId}
          onChange={(e) => setSelectedTagId(e.target.value)}
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.Id} value={tag.Id}>
              {tag.Name}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={selectedBoxId}
          onChange={(e) => setSelectedBoxId(e.target.value)}
        >
          <option value="">All Boxes</option>
          {boxes.map((box) => (
            <option key={box.Id} value={box.Id}>
              {box.Name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.cardList}>
        {filteredCards.length === 0 && !loading ? (
          <div className={styles.noCardsText}>No cards found</div>
        ) : (
          filteredCards.map((card) => (
            <div key={card.id} className={styles.cardItem}>
              <div className={styles.cardInfo}>
                <h4 className={styles.cardTitle}>{card.markdownTitle}</h4>
                <div className={styles.cardMeta}>
                  <span className={styles.tagBadge}>{card.tagName || "null"}</span>
                  <span className={styles.boxBadge}>{card.boxName || "null"}</span>
                </div>
              </div>

              <div className={styles.dropdownContainer}>
                <button
                  className={styles.dropdownButton}
                  onClick={() =>
                    setOpenDropdownId(
                      openDropdownId === card.id ? null : card.id,
                    )
                  }
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </button>

                {openDropdownId === card.id && (
                  <div className={styles.dropdownMenu}>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => openEdit(card.id)}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} /> Edit
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        setOpenDropdownId(null);
                        setChangeTagCardId(card.id);
                        setChangeTagNewId("");
                      }}
                    >
                      <FontAwesomeIcon icon={faTag} /> Change Tag
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => handleReset(card.id)}
                    >
                      <FontAwesomeIcon icon={faRotateLeft} /> Reset
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        setOpenDropdownId(null);
                        setDeleteTargetId(card.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrashCan} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={sentinelRef} />
        {loading && <div className={styles.noCardsText}>Loading...</div>}
      </div>

      <Modal
        isOpen={editCardId !== null}
        onClose={closeEdit}
        title="Edit Card"
        size="lg"
      >
        <div className={styles.editModalBody}>
          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>Card Title</h3>
            <Input
              key={editCardId}
              defaultValue={editTitle}
              onChange={setEditTitle}
              placeholder="Enter card title..."
            />
          </div>

          <div className={styles.editSection}>
            <h3 className={styles.editSectionTitle}>Card Content</h3>
            <Tabs
              tabs={[
                {
                  id: "content-view",
                  label: "View",
                  content: <MarkdownRender markdown={editContent} />,
                },
                {
                  id: "content-edit",
                  label: "Edit",
                  content: (
                    <MarkdownEditor
                      value={editContent}
                      onChange={setEditContent}
                    />
                  ),
                },
              ]}
            />
          </div>

          <div className={styles.editActions}>
            <Button className="secondary" label="Cancel" onClick={closeEdit} />
            <Button label="Save" onClick={handleSaveEdit} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={changeTagCardId !== null}
        onClose={() => setChangeTagCardId(null)}
        title="Change Tag"
        size="sm"
      >
        <div className={styles.editModalBody}>
          <select
            className="custom-select"
            value={changeTagNewId}
            onChange={(e) => setChangeTagNewId(e.target.value)}
          >
            <option value="">Select a tag...</option>
            {tags.map((tag) => (
              <option key={tag.Id} value={tag.Id}>
                {tag.Name}
              </option>
            ))}
          </select>
          <div className={styles.editActions}>
            <Button
              className="secondary"
              label="Cancel"
              onClick={() => setChangeTagCardId(null)}
            />
            <Button label="Save" onClick={handleChangeTag} />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this card?"
      />
    </MainContainer>
  );
}
