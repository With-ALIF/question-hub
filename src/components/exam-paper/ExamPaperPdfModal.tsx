"use client";

import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Bookmark,
  FolderOpen,
  Type,
  CheckSquare,
  Sliders,
  Sparkles,
  AlignLeft,
  Eye,
  X,
  Download,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateExamPaperHtml,
  printExamPaper,
  downloadExamPaperPdf,
} from "@/lib/exam-paper/print-engine";
import { getSavedQuestions, saveQuestion } from "@/lib/saved-questions";
import type { QuestionListItem } from "@/components/questions/QuestionCard";
import type { ExamPaperConfig } from "@/lib/exam-paper/types";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionListItem[];
  onOpenSaved?: (() => void) | undefined;
};

export function ExamPaperPdfModal({
  isOpen,
  onClose,
  questions,
  onOpenSaved,
}: Props) {
  const { tr, num, lang } = useI18n();

  const [title, setTitle] = useState(() =>
    tr("Selected questions exam paper", "নির্বাচিত প্রশ্নের পরীক্ষাপত্র"),
  );
  const [tutor, setTutor] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [marks, setMarks] = useState(String(questions.length || 50));
  const [time, setTime] = useState(() =>
    questions.length
      ? `${num(Math.ceil(questions.length * 1.2))} ${tr("min", "মিনিট")}`
      : `${num(50)} ${tr("min", "মিনিট")}`,
  );

  const [hasFourSets, setHasFourSets] = useState(false);
  const [withAnswers, setWithAnswers] = useState(true);

  const [questionSize, setQuestionSize] = useState(11);
  const [headerSize, setHeaderSize] = useState(24);

  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(90);
  const [watermarkImg, setWatermarkImg] = useState<string | null>(null);
  const [watermarkImgName, setWatermarkImgName] = useState(() =>
    tr("No image", "কোনো ছবি নেই"),
  );

  const [footerLeft, setFooterLeft] = useState("QuestionBank");
  const [footerRight, setFooterRight] = useState(() => tr("Exam paper", "পরীক্ষাপত্র"));

  const [savedCount, setSavedCount] = useState(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (questions.length) {
      setMarks(String(questions.length));
      setTime(
        `${num(Math.max(10, Math.ceil(questions.length * 1.2)))} ${tr("min", "মিনিট")}`,
      );
    }
    setSavedCount(getSavedQuestions().length);
  }, [questions.length, isOpen, tr, num]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWatermarkImgName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setWatermarkImg(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setWatermarkImg(null);
    setWatermarkImgName(tr("No image", "কোনো ছবি নেই"));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveQuestionsToSaved = () => {
    let added = 0;
    for (const q of questions) {
      saveQuestion(q);
      added++;
    }
    setSavedCount(getSavedQuestions().length);
    setSaveSuccessMsg(
      tr(
        `${num(added)} questions added to your saved list!`,
        `${num(added)}টি প্রশ্ন সেভ করা তালিকায় যোগ হয়েছে!`,
      ),
    );
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const getConfig = (): ExamPaperConfig => ({
    title: title.trim() || tr("Selected questions exam paper", "নির্বাচিত প্রশ্নের পরীক্ষাপত্র"),
    tutorName: tutor.trim() || undefined,
    subtitle: subtitle.trim() || undefined,
    marks: marks.trim() || String(questions.length),
    time: time.trim() || `${num(50)} ${tr("min", "মিনিট")}`,
    hasFourSets,
    withAnswers,
    questionSize,
    headerSize,
    watermarkText: watermarkText.trim() || undefined,
    watermarkOpacity,
    watermarkImageUrl: watermarkImg || undefined,
    footerLeft: footerLeft.trim() || undefined,
    footerRight: footerRight.trim() || undefined,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handlePreview = () => {
    const html = generateExamPaperHtml(questions, getConfig());
    setPreviewHtml(html);
    setShowPreviewModal(true);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const html = generateExamPaperHtml(questions, getConfig());
      const safeTitle = title.trim() || "exam-paper";
      await downloadExamPaperPdf(html, safeTitle);
    } catch (error) {
      console.error("Direct PDF download failed, falling back to browser print:", error);
      const html = generateExamPaperHtml(questions, getConfig());
      printExamPaper(html);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border bg-card shadow-2xl">
          <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
                  <span>{tr("Build exam paper", "পরীক্ষাপত্র তৈরি")}</span>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">PDF</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {tr("A complete exam paper will be created with the", "নির্বাচিত")}{" "}
                  <strong className="text-foreground">{num(questions.length)}</strong>
                  {lang === "bn" ? "" : " "}
                  {tr("selected questions.", "টি প্রশ্ন দিয়ে একটি সম্পূর্ণ পরীক্ষাপত্র তৈরি হবে।")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSaveQuestionsToSaved}
                className="h-8 gap-1 text-xs cursor-pointer"
              >
                <Bookmark className="size-3.5 text-primary" />
                <span>{tr("Save questions", "প্রশ্ন সেভ করুন")}</span>
              </Button>
              {onOpenSaved && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenSaved}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <FolderOpen className="size-3.5 text-muted-foreground" />
                  <span>{tr(`Saved (${num(savedCount)})`, `সেভ করা (${num(savedCount)})`)}</span>
                </Button>
              )}
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="mx-5 mt-3 rounded-lg bg-emerald-500/10 p-2.5 text-center text-xs font-semibold text-emerald-600 border border-emerald-500/20">
              {saveSuccessMsg}
            </div>
          )}

          <div className="p-4 sm:p-5 space-y-6">
            <section className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/10">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Type className="size-4 text-primary" />
                <div>
                  <h4 className="leading-none">{tr("Exam information", "পরীক্ষার তথ্য")}</h4>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {tr("Text shown in the paper header", "পাতার হেডারে যেসব লেখা বসবে")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pdfTitle" className="text-xs font-semibold">
                  {tr("Exam name", "পরীক্ষার নাম")}
                </Label>
                <Input
                  id="pdfTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={tr("Selected questions exam paper", "নির্বাচিত প্রশ্নের পরীক্ষাপত্র")}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pdfTutor" className="text-xs font-semibold">
                    {tr("Teacher's name", "শিক্ষকের নাম")}{" "}
                    <span className="text-muted-foreground font-normal">({tr("optional", "ঐচ্ছিক")})</span>
                  </Label>
                  <Input
                    id="pdfTutor"
                    value={tutor}
                    onChange={(e) => setTutor(e.target.value)}
                    placeholder={tr("e.g. Dr. Saiful Islam", "যেমন: ড. সাইফুল ইসলাম")}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdfSubj" className="text-xs font-semibold">
                    {tr("Title / Subject", "টাইটেল / সাবজেক্ট")}{" "}
                    <span className="text-muted-foreground font-normal">({tr("optional", "ঐচ্ছিক")})</span>
                  </Label>
                  <Input
                    id="pdfSubj"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder={tr("e.g. Chemistry Suggestions 2026", "যেমন: রসায়ন সাজেশন ২০২৬")}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pdfMarks" className="text-xs font-semibold">
                    {tr("Total marks", "পূর্ণমান")}
                  </Label>
                  <Input
                    id="pdfMarks"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={tr("80", "৮০")}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdfTime" className="text-xs font-semibold">
                    {tr("Time", "সময়")}
                  </Label>
                  <Input
                    id="pdfTime"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder={tr("60 minutes", "৬০ মিনিট")}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {tr("Header preview:", "হেডারে দেখাবে:")} {tr("Time:", "সময়:")} {time || "—"} |{" "}
                {tr("Marks:", "পূর্ণমান:")} {num(marks || "0")}
              </p>
            </section>

            <section className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/10">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CheckSquare className="size-4 text-primary" />
                <div>
                  <h4 className="leading-none">{tr("Questions & answers", "প্রশ্ন ও উত্তর")}</h4>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {tr("Sets, order & answer style", "সেট, ক্রম ও উত্তরের ধরন")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {tr("4 sets (A, B, C, D)", "৪টি সেট (A, B, C, D)")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tr(
                      "Different order per set · Answer key on one page · Solutions only in set A",
                      "প্রতি সেটে আলাদা ক্রম · উত্তর তালিকা এক পাতায় · সমাধান শুধু সেট A",
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="pdfSets"
                  checked={hasFourSets}
                  onChange={(e) => setHasFourSets(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pdfAns" className="text-xs font-semibold">
                  {tr("PDF type", "PDF টাইপ")}
                </Label>
                <select
                  id="pdfAns"
                  value={withAnswers ? "yes" : "no"}
                  onChange={(e) => setWithAnswers(e.target.value === "yes")}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="yes">
                    {tr("With answers — answer key & solutions", "উত্তরসহ — উত্তর তালিকা ও সমাধানসহ")}
                  </option>
                  <option value="no">{tr("Without answers — questions only", "উত্তর ছাড়া — শুধু প্রশ্ন")}</option>
                </select>
              </div>
            </section>

            <section className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/10">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Sliders className="size-4 text-primary" />
                <div>
                  <h4 className="leading-none">{tr("Layout & sizing", "লেআউট ও সাইজ")}</h4>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {tr("Control text size in the PDF", "PDF-এ লেখার আকার নিয়ন্ত্রণ করুন")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr("Question size", "প্রশ্ন সাইজ")}</span>
                    <span className="font-mono text-primary">{questionSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    step="1"
                    value={questionSize}
                    onChange={(e) => setQuestionSize(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{tr("Small (8px)", "ছোট (8px)")}</span>
                    <span>{tr("Large (24px)", "বড় (24px)")}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{tr("Header size", "হেডার সাইজ")}</span>
                    <span className="font-mono text-primary">{headerSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="40"
                    step="1"
                    value={headerSize}
                    onChange={(e) => setHeaderSize(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{tr("Small (14px)", "ছোট (14px)")}</span>
                    <span>{tr("Large (40px)", "বড় (40px)")}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/10">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Sparkles className="size-4 text-primary" />
                <div>
                  <h4 className="leading-none">{tr("Watermark", "ওয়াটারমার্ক")}</h4>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {tr("Appears lightly on every page", "সব পাতায় হালকা করে বসবে")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pdfWm" className="text-xs font-semibold">
                  {tr("Text", "টেক্সট")}{" "}
                  <span className="text-muted-foreground font-normal">({tr("optional", "ঐচ্ছিক")})</span>
                </Label>
                <Input
                  id="pdfWm"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={tr(
                    "e.g. QuestionHub or coaching name",
                    "যেমন: QuestionHub বা কোচিং-এর নাম",
                  )}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{tr("Transparency", "ট্রান্সপারেন্সি (স্বচ্ছতা)")}</span>
                  <span className="font-mono text-primary">{watermarkOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  step="1"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{tr("Dark (50%)", "গাঢ় (৫০%)")}</span>
                  <span>{tr("Light (98%)", "হালকা (৯৮%)")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {tr("Image", "ছবি")}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({tr("optional logo", "ঐচ্ছিক লোগো")})
                  </span>
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="wmFile"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 gap-1.5 text-xs cursor-pointer"
                  >
                    <Upload className="size-3.5 text-primary" />
                    <span>{tr("Choose image", "ছবি বাছুন")}</span>
                  </Button>
                  <span className="text-xs text-muted-foreground truncate max-w-xs">{watermarkImgName}</span>
                  {watermarkImg && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleClearImage}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      <span>{tr("Remove", "মুছুন")}</span>
                    </Button>
                  )}
                </div>
                {watermarkImg && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                    <img src={watermarkImg} alt="Preview" className="size-12 object-contain rounded border border-border" />
                    <span className="text-xs text-muted-foreground">
                      {tr(
                        "This image will be placed as a watermark in the center of the page",
                        "এই ছবিটি পাতার মাঝখানে ওয়াটারমার্ক হিসেবে বসবে",
                      )}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/10">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <AlignLeft className="size-4 text-primary" />
                <div>
                  <h4 className="leading-none">{tr("Footer", "ফুটার")}</h4>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {tr(
                      "Left and right side of each page footer",
                      "প্রতিটি পাতার নিচে বাম ও ডান দিকে",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pdfFootL" className="text-xs font-semibold">
                    {tr("Left text", "বাম দিকের লেখা")}
                  </Label>
                  <Input
                    id="pdfFootL"
                    value={footerLeft}
                    onChange={(e) => setFooterLeft(e.target.value)}
                    placeholder="QuestionBank"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdfFootR" className="text-xs font-semibold">
                    {tr("Right text", "ডান দিকের লেখা")}
                  </Label>
                  <Input
                    id="pdfFootR"
                    value={footerRight}
                    onChange={(e) => setFooterRight(e.target.value)}
                    placeholder={tr("Exam paper", "পরীক্ষাপত্র")}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2.5 border-t border-border bg-card/95 backdrop-blur-sm p-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="h-9 gap-1.5 text-xs cursor-pointer font-medium"
            >
              <Eye className="size-3.5 text-primary" />
              <span>{tr("Preview", "প্রিভিউ")}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs cursor-pointer"
            >
              <span>{tr("Cancel", "বাতিল")}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="h-9 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{tr("Creating PDF...", "PDF তৈরি হচ্ছে...")}</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>{tr("Download PDF", "PDF ডাউনলোড")}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showPreviewModal && (
        <Dialog open={true} onOpenChange={(open) => !open && setShowPreviewModal(false)}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 rounded-2xl overflow-hidden bg-card border-border">
            <div className="flex items-center justify-between border-b border-border p-3.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {tr("Exam paper live preview", "পরীক্ষাপত্র লাইভ প্রিভিউ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={isDownloading}
                  onClick={() => {
                    handleDownloadPdf();
                  }}
                  className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium cursor-pointer disabled:opacity-60"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{tr("Downloading...", "ডাউনলোড হচ্ছে...")}</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      <span>{tr("Download PDF", "PDF ডাউনলোড")}</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full overflow-hidden p-2 bg-neutral-100 dark:bg-neutral-900">
              <iframe
                srcDoc={previewHtml}
                title={tr("Exam Paper Preview", "পরীক্ষাপত্র প্রিভিউ")}
                className="w-full h-[76vh] border-0 rounded-lg bg-white shadow-inner"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
