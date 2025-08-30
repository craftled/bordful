import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/**
 * Normalize raw Markdown from Airtable into GitHub-Flavored Markdown.
 * Processes Airtable's markdown-like content into standard, well-formatted markdown
 * with proper list structure and consistent formatting.
 *
 * This function applies all necessary transformations in a single pass through the content
 * for better performance.
 *
 * @param raw The raw Markdown text from Airtable
 * @returns A cleaned, standardized Markdown string with proper paragraphs
 */
export function normalizeMarkdown(raw: string): string {
  if (!raw) {
    return '';
  }

  // First, apply some general regex replacements to standardize content
  let fixed = raw;

  // Preserve literal asterisks in text by temporarily replacing them
  fixed = fixed.replace(/\\\*/g, '___ESCAPED_ASTERISK___');

  // Ensure bolded section headers are properly separated into their own paragraphs
  fixed = fixed.replace(/([^\n])\n(\*\*[^*\n:]+(?::\*\*|\*\*))/g, '$1\n\n$2');
  fixed = fixed.replace(/([^\n])\n(\*\*[^*\n:]+:[^*\n]*\*\*)/g, '$1\n\n$2');

  // Detect and fix section introductions with bold text ending in colons
  // like "As a distributed team, **some key qualities are particularly important** for all of us at Hop Labs:"
  fixed = fixed.replace(/^(.+\s\*\*[^*\n:]+\*\*[^:\n]*:)\s*$/gm, (match) => {
    // Ensure it has proper paragraph breaks before and after
    return `\n${match}\n`;
  });

  // Fix common pattern where a list item has a paragraph marker attached to the end
  // This handles cases like "item text\nNew paragraph" where it should be "item text\n\nNew paragraph"
  fixed = fixed.replace(
    /^(\s*[-*+]\s+.+?)(\n)([A-Z][a-z])/gm,
    (_match, listItem, _newline, startOfParagraph) => {
      // Only add a blank line if it appears to be a new sentence/paragraph and not part of the list item
      return `${listItem}\n\n${startOfParagraph}`;
    }
  );

  // Fix cases where section introductions appear after list items
  // E.g., "last list item. What we're looking for **specifically for this role**:"
  fixed = fixed.replace(
    /^(\s*[-*+]\s+[^\n]+)(\s+)([A-Z][a-z][^:]*\s\*\*[^*\n]+\*\*[^:\n]*:)$/gm,
    (_match, listItem, _spacing, sectionIntro) => {
      // Split the section intro as a separate paragraph
      return `${listItem}\n\n${sectionIntro}`;
    }
  );

  // Split the content into lines for processing
  const lines = fixed.split('\n');
  const result: string[] = [];

  // Stack to track list hierarchy
  type ListState = {
    indent: number; // The indentation level of this list item
    marker: string; // The list marker used (e.g., "- " or "1. " or "a. ")
    type: 'ul' | 'ol'; // Type of list (unordered or ordered)
    hasBoldHeader: boolean; // Whether this list item has a bolded header
    markerStyle?: 'number' | 'letter'; // Style of ordered list markers (1,2,3 or a,b,c)
  };

  // Initialize an empty stack to track list context
  const listStack: ListState[] = [];

  // Keep track of previous line info for context
  let previousLineWasEmptyOrHeading = true; // Start as true for first line
  let insideListItem = false;
  let currentListItemContent = '';
  let currentListItemIndent = '';

  // Process each line with stack-based list tracking
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const line = originalLine;
    const trimmedLine = line.trim();

    // Skip completely empty lines but preserve them
    if (trimmedLine === '') {
      result.push('');
      previousLineWasEmptyOrHeading = true;

      // If we have two consecutive empty lines, reset list context
      if (i > 0 && lines[i - 1].trim() === '') {
        listStack.length = 0;
        insideListItem = false;
      }
      continue;
    }

    // Detect section introductions with bold text that end with a colon
    const sectionIntroMatch = trimmedLine.match(
      /^([A-Z][a-z].*?\s\*\*[^*\n]+\*\*[^:\n]*:)$/
    );

    if (sectionIntroMatch && !originalLine.match(/^(\s*)[-*+]\s+/)) {
      // This is a section introduction paragraph - should be separated

      // If we were inside a list item, finish that first
      if (insideListItem && currentListItemContent) {
        result.push(`${currentListItemIndent}${currentListItemContent}`);
        result.push(''); // Add a blank line
        currentListItemContent = '';
        insideListItem = false;
      }

      // Add an empty line before if needed
      if (
        !previousLineWasEmptyOrHeading &&
        result.length > 0 &&
        result.at(-1) !== ''
      ) {
        result.push('');
      }

      // Add the section introduction
      result.push(trimmedLine);

      // Add an empty line after to separate it from the next section
      result.push('');

      previousLineWasEmptyOrHeading = true;
      continue;
    }

    // Detect standalone bold section headers (not in lists) with or without colons
    const boldSectionHeaderMatch = trimmedLine.match(
      /^\*\*([^*\n:]+)(?::|)\*\*$/
    );

    if (boldSectionHeaderMatch && !originalLine.match(/^(\s*)[-*+]\s+/)) {
      // This is a standalone bolded section header, add an empty line before it
      // if it's not already preceded by one
      if (
        !previousLineWasEmptyOrHeading &&
        result.length > 0 &&
        result.at(-1) !== ''
      ) {
        result.push('');
      }

      result.push(trimmedLine);

      // Add an empty line after to ensure it's treated as a separate paragraph
      result.push('');

      previousLineWasEmptyOrHeading = true;
      insideListItem = false;
      continue;
    }

    // Check for headings
    if (trimmedLine.startsWith('#')) {
      // Clear the list stack when encountering headings
      listStack.length = 0;
      insideListItem = false;
      result.push(trimmedLine);
      previousLineWasEmptyOrHeading = true;
      continue;
    }

    // Calculate indentation level
    const indentMatch = originalLine.match(/^(\s*)/);
    const indentation = indentMatch ? indentMatch[1].length : 0;

    // Detect list items - handle standard numbered lists, letter lists, and unordered lists
    const unorderedMatch = trimmedLine.match(/^[-*+]\s+(.*)/);
    const orderedNumMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
    const orderedLetterMatch = trimmedLine.match(/^[a-z]\.\s+(.*)/i);

    // Combine all list item matches
    const orderedMatch = orderedNumMatch || orderedLetterMatch;

    if (unorderedMatch || orderedMatch) {
      // If we were inside a list item and now starting a new one, commit the previous list item
      if (insideListItem && currentListItemContent) {
        result.push(`${currentListItemIndent}${currentListItemContent}`);
        currentListItemContent = '';
      }

      // This is a list item - determine type and content
      let content = '';
      let listType: 'ul' | 'ol' = 'ul';
      let marker = '-';
      let markerStyle: 'number' | 'letter' | undefined;

      if (unorderedMatch) {
        content = unorderedMatch[1];
        listType = 'ul';
        marker = '-';
      } else if (orderedNumMatch) {
        content = orderedNumMatch[1];
        listType = 'ol';
        marker = '1.';
        markerStyle = 'number';
      } else if (orderedLetterMatch) {
        content = orderedLetterMatch[1];
        listType = 'ol';
        marker = 'a.';
        markerStyle = 'letter';
      }

      // Check if this is a bolded header with colon (e.g., "**Frontend Development:**")
      const hasBoldHeader = /^\*\*[^*]+:\*\*/.test(content);

      // Start a new list item
      insideListItem = true;

      // Detect bolded list item that contains another bolded section header
      const containsEmbeddedHeader = content.match(
        /^(.*?)\s+(\*\*[^*\n:]+(?::|)\*\*)\s*$/
      );

      if (containsEmbeddedHeader) {
        // Split the content to separate the bold header
        content = containsEmbeddedHeader[1].trim();

        // Process the current list item first
        if (content) {
          // Handle the regular content part
          // Adjust the stack based on indentation
          if (listStack.length === 0) {
            // Start a new list
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader: false,
              markerStyle,
            });
          } else if (indentation > listStack.at(-1).indent) {
            // This is a nested list
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader: false,
              markerStyle,
            });
          } else {
            // Pop items from stack until we find the appropriate level
            while (
              listStack.length > 0 &&
              indentation <= listStack.at(-1).indent
            ) {
              listStack.pop();
            }
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader: false,
              markerStyle,
            });
          }

          // Format the list item with proper indentation
          const properIndent = '  '.repeat(listStack.length - 1);
          result.push(`${properIndent}${marker} ${content}`);
        }

        // Add a line break before the bold header
        result.push('');

        // Then add the bold header as a separate item
        result.push(containsEmbeddedHeader[2]);

        // Add a line break after the bold header
        result.push('');

        previousLineWasEmptyOrHeading = true;
        insideListItem = false;
        continue;
      }

      // Look for section introductions embedded in list items
      // Like "You have 5+ years of experience. As a distributed team, **qualities are important**:"
      const embeddedSectionIntro = content.match(
        /^(.*?\.)(\s+)([A-Z][a-z].*?\s\*\*[^*\n]+\*\*[^:\n]*:)$/
      );

      if (embeddedSectionIntro) {
        // Split this into a list item followed by a separate paragraph
        const listItemContent = embeddedSectionIntro[1].trim();
        const sectionIntroText = embeddedSectionIntro[3].trim();

        // Process just the list item part
        if (listItemContent) {
          // Calculate the list level based on indentation and context
          if (listStack.length === 0) {
            // Start a new list
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader,
              markerStyle,
            });
          } else if (indentation > listStack.at(-1).indent) {
            // This is a nested list
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader,
              markerStyle,
            });
          } else {
            // Pop items from stack until we find the appropriate level
            while (
              listStack.length > 0 &&
              indentation <= listStack.at(-1).indent
            ) {
              listStack.pop();
            }
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader,
              markerStyle,
            });
          }

          // Format the list item with proper indentation
          const properIndent = '  '.repeat(listStack.length - 1);
          result.push(`${properIndent}${marker} ${listItemContent}`);
        }

        // Reset list context
        listStack.length = 0;
        insideListItem = false;

        // Add blank line before section intro
        result.push('');

        // Add the section intro as a separate paragraph
        result.push(sectionIntroText);

        // Add blank line after section intro
        result.push('');

        previousLineWasEmptyOrHeading = true;
        continue;
      }

      // Check for list items that have new paragraph indicators
      const newParagraphIndicator = content.match(
        /^(.*?)(\s{2,}|\t)([A-Z][a-z].+)$/
      );
      if (newParagraphIndicator) {
        // There's a paragraph break within the list item content
        content = newParagraphIndicator[1].trim();

        // Store the second part to be processed as a separate paragraph
        const paragraphContent = newParagraphIndicator[3].trim();

        // Process just the first part as a list item now
        if (content) {
          // Calculate the list level based on indentation and context
          if (listStack.length === 0) {
            // Start a new list
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader,
              markerStyle,
            });
          } else if (indentation > listStack.at(-1).indent) {
            // This is a nested list
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader,
              markerStyle,
            });
          } else {
            // Pop items from stack until we find the appropriate level
            while (
              listStack.length > 0 &&
              indentation <= listStack.at(-1).indent
            ) {
              listStack.pop();
            }
            listStack.push({
              indent: indentation,
              marker,
              type: listType,
              hasBoldHeader,
              markerStyle,
            });
          }

          // Format the list item with proper indentation
          const properIndent = '  '.repeat(listStack.length - 1);
          result.push(`${properIndent}${marker} ${content}`);

          // Add a blank line to separate the list item from the paragraph
          result.push('');

          // Add the paragraph content as a separate paragraph
          result.push(paragraphContent);

          previousLineWasEmptyOrHeading = false;
          insideListItem = false;
          continue;
        }
      }

      // Calculate the list level based on indentation and context
      if (listStack.length === 0) {
        // Start a new list
        listStack.push({
          indent: indentation,
          marker,
          type: listType,
          hasBoldHeader,
          markerStyle,
        });
      } else if (indentation > listStack.at(-1).indent) {
        // This is a nested list
        listStack.push({
          indent: indentation,
          marker,
          type: listType,
          hasBoldHeader,
          markerStyle,
        });
      } else {
        // Pop items from stack until we find the appropriate level
        while (listStack.length > 0 && indentation <= listStack.at(-1).indent) {
          listStack.pop();
        }
        listStack.push({
          indent: indentation,
          marker,
          type: listType,
          hasBoldHeader,
          markerStyle,
        });
      }

      // Format the list item with proper indentation
      const properIndent = '  '.repeat(listStack.length - 1);
      currentListItemIndent = properIndent;
      currentListItemContent = `${marker} ${content}`;

      // Special handling for bolded headers in lists
      if (hasBoldHeader) {
        // Ensure there's spacing before bolded headers in lists if not at start
        if (!previousLineWasEmptyOrHeading && listStack.length === 1) {
          result.push(''); // Add empty line before top-level bolded headers
        }

        // For bolded headers, add the list item immediately
        result.push(`${properIndent}${marker} ${content}`);
        insideListItem = false;
        currentListItemContent = '';
      }

      previousLineWasEmptyOrHeading = false;
    } else {
      // This is not a list item
      if (listStack.length > 0) {
        // Check if this is content belonging to the previous list item
        const lastItem = listStack.at(-1);

        // Check if this is a section introduction (with bold text and ending in colon)
        const isSectionIntro = trimmedLine.match(
          /^[A-Z].*?\s\*\*[^*\n]+\*\*[^:\n]*:$/
        );

        if (isSectionIntro) {
          // This is a section introduction - should be separated from the list

          // Push any accumulated list item content
          if (insideListItem && currentListItemContent) {
            result.push(`${currentListItemIndent}${currentListItemContent}`);
            currentListItemContent = '';
            insideListItem = false;
          }

          // Reset list context
          listStack.length = 0;

          // Add blank line before section intro
          result.push('');

          // Add the section intro as a standalone paragraph
          result.push(trimmedLine);

          // Add blank line after section intro
          result.push('');

          previousLineWasEmptyOrHeading = true;
          continue;
        }

        if (indentation >= lastItem.indent) {
          // This is content at the same or greater indentation level as the list item
          const listIndent = '  '.repeat(listStack.length - 1);
          const contentIndent = '  '; // Standard markdown indentation for content

          // Check if this starts with a bold section marker that should be separated
          if (
            /^\*\*[^*\n:]+:?\*\*/.test(trimmedLine) &&
            !trimmedLine.match(/^\*\*[^*:]+\*\*.*?[a-z]/)
          ) {
            // Not a bold inside a sentence

            // If we have accumulated content for a list item, push it
            if (insideListItem && currentListItemContent) {
              result.push(`${currentListItemIndent}${currentListItemContent}`);
              currentListItemContent = '';
              insideListItem = false;
            }

            // Add an empty line before the bolded section
            result.push('');

            // Add the bolded section as a standalone paragraph
            result.push(trimmedLine);

            // Add an empty line after
            result.push('');

            // Reset list context since this is a new section
            listStack.length = 0;

            previousLineWasEmptyOrHeading = true;
          }
          // Check if this line appears to be a new paragraph starting with a capital letter
          else if (
            /^[A-Z][a-z]/.test(trimmedLine) || // Line starts with a capital letter
            (!trimmedLine.match(/^[-*+]|^\d+\.|^[a-z]\./) && // Not a list marker
              trimmedLine !== '' && // Not an empty line
              indentation === lastItem.indent) // At the exact same indentation as the list item
          ) {
            // This looks like a new paragraph or non-list content

            // If we have accumulated content for a list item, push it
            if (insideListItem && currentListItemContent) {
              result.push(`${currentListItemIndent}${currentListItemContent}`);
              result.push(''); // Add blank line
              currentListItemContent = '';
              insideListItem = false;
            }

            // Push this as a regular paragraph
            result.push(trimmedLine);

            // Add a blank line after
            result.push('');

            previousLineWasEmptyOrHeading = true;
          } else {
            // Check if this line contains a bold header that should be separated
            const embeddedBoldHeader = trimmedLine.match(
              /^\*\*([^*\n:]+)(?::|)\*\*$/
            );

            if (embeddedBoldHeader) {
              // This is a bold header inside list content, add an empty line before it
              if (i > 0 && !previousLineWasEmptyOrHeading) {
                result.push(`${listIndent}${contentIndent}`);
              }
              result.push(`${listIndent}${contentIndent}${trimmedLine}`);
              // Add an empty line after
              result.push(`${listIndent}${contentIndent}`);
              previousLineWasEmptyOrHeading = true;
            } else {
              // Normal list item content, add to the current item if we're inside one
              if (insideListItem) {
                // Check if this contains a section intro pattern within content
                const contentSectionIntro = trimmedLine.match(
                  /^(.*?\.)(\s+)([A-Z][a-z].*?\s\*\*[^*\n]+\*\*[^:\n]*:)$/
                );

                if (contentSectionIntro) {
                  // Split into regular content and section intro
                  const regularContent = contentSectionIntro[1].trim();
                  const introContent = contentSectionIntro[3].trim();

                  // Add the regular content to the current list item
                  if (regularContent) {
                    if (currentListItemContent.length > 0) {
                      currentListItemContent += ` ${regularContent}`;
                    } else {
                      currentListItemContent = regularContent;
                    }
                  }

                  // Push the current list item
                  result.push(
                    `${currentListItemIndent}${currentListItemContent}`
                  );

                  // Reset list tracking
                  listStack.length = 0;
                  insideListItem = false;
                  currentListItemContent = '';

                  // Add blank line
                  result.push('');

                  // Add section intro as standalone paragraph
                  result.push(introContent);

                  // Add blank line after
                  result.push('');

                  previousLineWasEmptyOrHeading = true;
                  continue;
                }
                // If content contains a line starting with bold, special handling
                if (
                  trimmedLine.startsWith('**') &&
                  !trimmedLine.match(/^\*\*[^*]+\*\*[^A-Z]/)
                ) {
                  // Not just emphasis in a sentence

                  // Push the existing list item first
                  result.push(
                    `${currentListItemIndent}${currentListItemContent}`
                  );

                  // Add a blank line
                  result.push('');

                  // Then add this as separate content
                  result.push(trimmedLine);

                  insideListItem = false;
                  currentListItemContent = '';
                } else {
                  // Append to the current list item content (with proper spacing)
                  if (currentListItemContent.length > 0) {
                    currentListItemContent += ` ${trimmedLine}`;
                  } else {
                    currentListItemContent = trimmedLine;
                  }
                }
              } else {
                // Not inside a list item, just add the content with proper indentation
                result.push(`${listIndent}${contentIndent}${trimmedLine}`);
              }
              previousLineWasEmptyOrHeading = false;
            }
          }
        } else {
          // This is outside the list - reset the stack
          listStack.length = 0;
          insideListItem = false;

          // If we have accumulated list item content, push it first
          if (currentListItemContent) {
            result.push(`${currentListItemIndent}${currentListItemContent}`);
            currentListItemContent = '';
          }

          result.push(trimmedLine);
          previousLineWasEmptyOrHeading = false;
        }
      } else {
        // Regular paragraph text
        // If we have accumulated list item content, push it first
        if (insideListItem && currentListItemContent) {
          result.push(`${currentListItemIndent}${currentListItemContent}`);
          currentListItemContent = '';
          insideListItem = false;
        }

        result.push(trimmedLine);

        // Add paragraph break if next line is not empty and not a list continuation
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (
          nextLine !== '' &&
          !nextLine.startsWith('-') &&
          !nextLine.startsWith('*') &&
          !nextLine.startsWith('+') &&
          !nextLine.match(/^\d+\.\s+/) &&
          !nextLine.match(/^[a-z]\.\s+/i)
        ) {
          result.push('');
        }

        previousLineWasEmptyOrHeading = false;
      }
    }
  }

  // Don't forget to add any remaining list item content
  if (insideListItem && currentListItemContent) {
    result.push(`${currentListItemIndent}${currentListItemContent}`);
  }

  // Join the processed lines
  let processed = result.join('\n');

  // Apply additional formatting with regex for specific patterns

  // Ensure standalone bold headers are properly formatted with spacing
  processed = processed.replace(/^(\*\*[^*\n:]+(?::|)\*\*)\s*$/gm, (match) => {
    return `${match}\n`;
  });

  // Fix bolded headers with proper spacing
  processed = processed.replace(
    /^(\s*)[-*+]\s+\*\*([^*\n]+):\*\*\s*$/gm,
    (_match, indent, title) => {
      return `${indent}- **${title}:**`;
    }
  );

  // Fix bold headers with colons to preserve spaces after the colon
  processed = processed.replace(/\*\*([^*\n:]+):\s*\*\*/g, (_match, title) => {
    return `**${title}:** `;
  });

  // Ensure proper nesting for nested lists following bold headers
  processed = processed.replace(
    /^(\s*)[-*+]\s+\*\*([^*\n]+):\*\*\s*\n(\s*)[-*+]\s+/gm,
    (match, indent1, title, indent2) => {
      // Check if the following list item should be nested
      if (indent2.length <= indent1.length) {
        // Add proper indentation for nested item
        return `${indent1}- **${title}:**\n${indent1}  - `;
      }
      return match; // Keep as is if already properly nested
    }
  );

  // Ensure proper nesting for mixed list types (numbered followed by unordered)
  processed = processed.replace(
    /^(\s*)(\d+)\.\s+\*\*([^*\n]+):\*\*\s*\n(\s*)[-*+]\s+/gm,
    (match, indent1, number, title, indent2) => {
      // Check if the following list item should be nested
      if (indent2.length <= indent1.length) {
        // Add proper indentation for nested item
        return `${indent1}${number}. **${title}:**\n${indent1}  - `;
      }
      return match; // Keep as is if already properly nested
    }
  );

  // Ensure proper nesting for mixed list types (unordered followed by numbered)
  processed = processed.replace(
    /^(\s*)[-*+]\s+\*\*([^*\n]+):\*\*\s*\n(\s*)(\d+)\.\s+/gm,
    (match, indent1, title, indent2, number) => {
      // Check if the following list item should be nested
      if (indent2.length <= indent1.length) {
        // Add proper indentation for nested item
        return `${indent1}- **${title}:**\n${indent1}  ${number}. `;
      }
      return match; // Keep as is if already properly nested
    }
  );

  // Fix nested numbering for ordered lists
  processed = processed.replace(
    /^(\s*)(\d+)\.\s+(.+)\n(\s*)(\d+)\.\s+/gm,
    (match, indent1, number1, content, indent2) => {
      // If indentation increases, this is a nested list
      if (indent2.length > indent1.length) {
        // Reset the numbering to 1 for nested lists
        return `${indent1}${number1}. ${content}\n${indent2}1. `;
      }
      return match; // Keep as is if not nested
    }
  );

  // Find section introductions that aren't properly separated
  processed = processed.replace(
    /([^\n])(\n)([A-Z][a-z].*?\s\*\*[^*\n]+\*\*[^:\n]*:)(\n)/g,
    (_match, prevContent, _newline1, sectionIntro) => {
      // Make sure section intros have paragraphs breaks
      return `${prevContent}\n\n${sectionIntro}\n\n`;
    }
  );

  // Handle bold text formatting (preserve original spacing)
  processed = processed.replace(/\*\*\s*([^*\n]+?)\s*\*\*/g, (_, content) => {
    return `**${content}**`;
  });

  // Fix missing spaces between bold text and opening parentheses
  processed = processed.replace(/\*\*([^*\n]+?)\*\*\(/g, '**$1** (');

  // Ensure proper separation between paragraphs and lists
  processed = processed.replace(/([^\n])\n([-*+\d][.*\-+]?\s)/g, '$1\n\n$2');

  // Ensure proper separation between headings and content
  processed = processed.replace(/(^#[^\n]+)\n([^#\n])/gm, '$1\n\n$2');

  // Fix line breaks within list items that might contain bolded text
  // This prevents improper breaking of lines with bold formatting
  processed = processed.replace(
    /^(\s*)[-*+]\s+([^*\n]*)\*\*([^*\n]+)\*\*$/gm,
    (_match, indent, prefix, boldText) => {
      return `${indent}- ${prefix}**${boldText}**`;
    }
  );

  // Fix incorrectly split bold text in list items
  processed = processed.replace(
    /^(\s*)[-*+]\s+([^*\n]*?)(\n+)(\*\*[^*\n]+\*\*)/gm,
    (match, indent, prefix, _newlines, boldText) => {
      // Only combine if it looks like they should be together
      if (
        prefix.trim().endsWith('with') ||
        prefix.trim().endsWith('in') ||
        prefix.trim().endsWith('and') ||
        prefix.trim().endsWith('for') ||
        prefix.trim().endsWith('using')
      ) {
        return `${indent}- ${prefix} ${boldText}`;
      }
      return match;
    }
  );

  // Ensure proper separation around bold headers that are section markers
  processed = processed.replace(/^(\*\*[^*\n:]+(?::|)\*\*)$/gm, (match) => {
    return `\n${match}\n`;
  });

  // Remove excessive blank lines (more than 2 consecutive)
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // Restore literal asterisks
  processed = processed.replace(/___ESCAPED_ASTERISK___/g, '\\*');

  // Process the Markdown through unified with standard settings
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '*', // Use asterisks for bullet points
      listItemIndent: 'one', // Use one space for list item indentation
      emphasis: '_', // Use underscores for emphasis
      strong: '*', // Use asterisks for strong emphasis
      fence: '`', // Use backticks for fenced code blocks
      fences: true, // Always use fenced code blocks
      resourceLink: false, // Use autolinks when possible
      rule: '-', // Use hyphens for thematic breaks
      ruleSpaces: false, // No spaces between markers in thematic breaks
    })
    .processSync(processed);

  return String(file);
}
