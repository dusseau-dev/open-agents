"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { FileSuggestion } from "@/app/api/sessions/[sessionId]/files/route";
import { FileTree as PierreFileTree, useFileTree } from "@pierre/trees/react";

type FileTreeProps = {
  files: FileSuggestion[];
  repoName?: string | null;
  onFileClick: (filePath: string) => void;
};

export function FileTree({ files, repoName, onFileClick }: FileTreeProps) {
  const onFileClickRef = useRef(onFileClick);
  onFileClickRef.current = onFileClick;

  const repoNameRef = useRef(repoName);
  repoNameRef.current = repoName;

  const paths = useMemo(() => {
    const prefix = repoName ? `${repoName}/` : "";
    // Pierre's tree auto-builds directory nesting from file paths. Including
    // both the file paths AND the API's explicit directory entries causes
    // "Path collides with an existing entry" crashes when a file's name
    // matches a sibling directory (e.g. a file named `__tests__` next to a
    // `__tests__/` dir). Pass file paths only and dedupe defensively.
    const seen = new Set<string>();
    const result: string[] = [];
    for (const f of files) {
      if (f.isDirectory) continue;
      const path = `${prefix}${f.value}`;
      if (seen.has(path)) continue;
      seen.add(path);
      result.push(path);
    }
    return result;
  }, [files, repoName]);

  const handleSelectionChange = useCallback(
    (selectedPaths: readonly string[]) => {
      if (selectedPaths.length === 0) return;
      const path = selectedPaths[selectedPaths.length - 1];
      // only fire for files, not directories
      if (!path.endsWith("/")) {
        const prefix = repoNameRef.current ? `${repoNameRef.current}/` : "";
        const stripped =
          prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
        onFileClickRef.current(stripped);
      }
    },
    [],
  );

  const { model } = useFileTree({
    paths,
    density: "compact",
    // expand root folder (level 1) so repo name is open by default
    initialExpansion: 1,
    flattenEmptyDirectories: true,
    onSelectionChange: handleSelectionChange,
  });

  // keep paths in sync when files change
  const prevPathsRef = useRef(paths);
  useEffect(() => {
    if (prevPathsRef.current !== paths) {
      prevPathsRef.current = paths;
      model.resetPaths(paths);
    }
  }, [paths, model]);

  if (files.length === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/25 py-8 text-center">
        <p className="text-xs text-muted-foreground">No files found</p>
      </div>
    );
  }

  return (
    <PierreFileTree
      model={model}
      style={
        {
          "--trees-fg-override": "var(--foreground)",
          "--trees-border-color-override": "var(--border)",
          "--trees-selected-bg-override": "var(--muted)",
          "--trees-bg-muted-override":
            "color-mix(in oklch, var(--muted) 50%, transparent)",
          "--trees-padding-inline-override": "6px",
          paddingTop: "8px",
          height: "100%",
        } as React.CSSProperties
      }
    />
  );
}
