// app/api/bom/ppic/route.ts
import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface BomData {
  TransID: number;
  Level: number;
  ParentItemID: string | null;
  ParentItemName: string | null;
  ItemID: string;
  ItemName: string;
  ItemName2: string;
  Qty: number;
  CumulativeQty: number;
  Departemen: string;
  NamaJenis: string;
  ItemPath: string;
  SortPath: string;
}

interface BomTreeNode extends BomData {
  children?: BomTreeNode[];
  expanded?: boolean;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const itemid = url.searchParams.get("itemid");

  if (!itemid) {
    return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
  }

  try {
    const pool = await getPool();

    console.log("Fetching BOM for item:", itemid);

    const result = await pool
      .request()
      .input("itemid", sql.VarChar(50), itemid)
      .execute("dbo.rpBOMTree");

    const bomData = result.recordset as BomData[];

    console.log(`Found ${bomData.length} BOM items for ${itemid}`);

    if (bomData.length > 0) {
      console.log("First few BOM items:", bomData.slice(0, 3));
      console.log("Data structure sample:", {
        level: bomData[0].Level,
        parentId: bomData[0].ParentItemID,
        itemId: bomData[0].ItemID,
        hasChildren: bomData.some(
          (item) => item.ParentItemID === bomData[0].ItemID
        ),
      });
    }

    // Build tree structure from the hierarchical data
    const bomTree = buildBomTreeFromHierarchicalData(bomData);

    console.log(`Built tree with ${bomTree.length} root nodes`);
    if (bomTree.length > 0) {
      console.log("Tree root:", {
        id: bomTree[0].ItemID,
        name: bomTree[0].ItemName,
        children: bomTree[0].children?.length || 0,
      });
    }

    return NextResponse.json({
      flat: bomData,
      tree: bomTree,
    });
  } catch (error) {
    console.error("Error fetching BOM data:", error);
    return NextResponse.json(
      {
        error: "Error fetching BOM data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Build tree from hierarchical data with Level information - IMPROVED VERSION
function buildBomTreeFromHierarchicalData(flatData: BomData[]): BomTreeNode[] {
  if (!flatData || flatData.length === 0) {
    console.log("No flat data available to build tree");
    return [];
  }

  console.log(`Building tree from ${flatData.length} hierarchical items`);

  // Create a map of all nodes by ItemID for quick lookup
  const nodeMap = new Map<string, BomTreeNode>();
  const rootNodes: BomTreeNode[] = [];

  // First pass: create all nodes
  flatData.forEach((item) => {
    const treeNode: BomTreeNode = {
      ...item,
      children: [],
      expanded: item.Level === 0, // Auto-expand root node
    };

    nodeMap.set(item.ItemID, treeNode);
  });

  console.log(`Created ${nodeMap.size} nodes in nodeMap`);

  // Second pass: build hierarchy
  flatData.forEach((item) => {
    const currentNode = nodeMap.get(item.ItemID);
    if (!currentNode) return;

    // If ParentItemID is NULL or empty, it's a root node
    if (!item.ParentItemID) {
      rootNodes.push(currentNode);
      console.log(`Added root node: ${item.ItemID}`);
    } else {
      // Find parent node
      const parentNode = nodeMap.get(item.ParentItemID);
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        parentNode.children.push(currentNode);
        console.log(
          `Added child ${item.ItemID} to parent ${item.ParentItemID}`
        );
      } else {
        console.warn(
          `Parent node ${item.ParentItemID} not found for child ${item.ItemID}`
        );
        // If parent not found but level > 0, treat as root node
        rootNodes.push(currentNode);
      }
    }
  });

  // Sort children by SortPath to maintain correct order
  const sortTree = (nodes: BomTreeNode[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => a.SortPath.localeCompare(b.SortPath));
        sortTree(node.children);
      }
    });
  };

  sortTree(rootNodes);

  console.log(`Final tree has ${rootNodes.length} root nodes`);

  // Log tree structure for debugging
  if (rootNodes.length > 0) {
    const logTree = (node: BomTreeNode, level: number = 0) => {
      const indent = "  ".repeat(level);
      console.log(
        `${indent}${node.ItemID} - ${node.ItemName} (Level: ${
          node.Level
        }, Children: ${node.children?.length || 0})`
      );
      if (node.children) {
        node.children.forEach((child) => logTree(child, level + 1));
      }
    };

    console.log("Tree structure:");
    rootNodes.forEach((root) => logTree(root));
  }

  return rootNodes;
}
