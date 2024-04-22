import { walk } from "https://deno.land/std@0.208.0/fs/mod.ts";
import {
  ArrayLiteralExpression,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  ResolutionHosts,
  SyntaxKind,
} from "https://deno.land/x/ts_morph@20.0.0/mod.ts";

async function main() {
  // copy canary docs over to latest and delete
  for await (const entry of walk("./docs/canary")) {
    if (entry.isFile) {
      if (entry.path === "docs/canary/the-canary-version/index.md") {
        continue;
      }
      const destPath = entry.path.replace("/canary/", "/latest/");
      await Deno.copyFile(entry.path, destPath);
      await Deno.remove(entry.path);
    }
  }

  // modify toc.ts
  await modifyTOCFile();
}

async function modifyTOCFile(): Promise<void> {
  const project = new Project({
    resolutionHost: ResolutionHosts.deno,
  });
  const tocTs = project.addSourceFileAtPath("./docs/toc.ts");
  const tocObject = tocTs.getVariableDeclarationOrThrow("toc")
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

  const canaryObject = getInitializerFromProperty<ObjectLiteralExpression>(
    tocObject,
    "canary",
    SyntaxKind.ObjectLiteralExpression,
  );
  const contentObject = getInitializerFromProperty<ObjectLiteralExpression>(
    canaryObject,
    "content",
    SyntaxKind.ObjectLiteralExpression,
  );
  updateLinksInContentObject(contentObject);

  await Deno.writeTextFile("./docs/toc.ts", tocTs.getFullText());
}

function getInitializerFromProperty<T extends ObjectLiteralExpression>(
  parentObject: ObjectLiteralExpression,
  propertyName: string,
  kind: SyntaxKind,
): T {
  const property = parentObject.getPropertyOrThrow(propertyName);
  if (!PropertyAssignment.isPropertyAssignment(property)) {
    throw new Error(`'${propertyName}' is not a PropertyAssignment.`);
  }
  return property.getInitializerIfKindOrThrow(kind) as T;
}

function updateLinksInContentObject(contentObject: ObjectLiteralExpression) {
  contentObject.getProperties().forEach((subsectionProperty) => {
    const pagesArray = getPagesArrayFromSubsection(subsectionProperty);
    if (pagesArray) {
      updateLinksInPagesArray(pagesArray);
    }
  });
}

function getPagesArrayFromSubsection(
  subsectionElement: ObjectLiteralElementLike,
) {
  if (PropertyAssignment.isPropertyAssignment(subsectionElement)) {
    const subsectionObject = subsectionElement.getInitializerIfKindOrThrow(
      SyntaxKind.ObjectLiteralExpression,
    );
    const pagesProperty = subsectionObject.getProperty("pages");
    if (
      pagesProperty && PropertyAssignment.isPropertyAssignment(pagesProperty)
    ) {
      return pagesProperty.getInitializerIfKindOrThrow(
        SyntaxKind.ArrayLiteralExpression,
      );
    }
  }
  return undefined;
}

function updateLinksInPagesArray(pagesArray: ArrayLiteralExpression) {
  pagesArray.getElements().forEach((element) => {
    const tuple = element.asKind(SyntaxKind.ArrayLiteralExpression);
    if (tuple && tuple.getElements().length >= 3) {
      const linkElement = tuple.getElements()[2];
      if (
        linkElement.getKind() === SyntaxKind.StringLiteral &&
        linkElement.getText() === '"link:canary"'
      ) {
        linkElement.replaceWithText('"link:latest"');
      }
    }
  });
}

main();
