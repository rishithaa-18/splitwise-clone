import pool from '../models/db.js';
import crypto from 'crypto';

// Create a new group — creator is automatically added as a member
export const createGroup = async (req, res) => {
  const { name } = req.body;
  const userId = req.userId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate a short unique invite code for joining
    const inviteCode = crypto.randomBytes(4).toString('hex'); // e.g. "a1b2c3d4"

    const groupResult = await client.query(
      'INSERT INTO groups (name, created_by, invite_code) VALUES ($1, $2, $3) RETURNING id, name, invite_code, created_at',
      [name.trim(), userId, inviteCode]
    );
    const group = groupResult.rows[0];

    // Add creator as first member
    await client.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        createdAt: group.created_at,
        memberCount: 1,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error while creating group' });
  } finally {
    client.release();
  }
};

// Join an existing group using an invite code
export const joinGroup = async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.userId;

  if (!inviteCode || !inviteCode.trim()) {
    return res.status(400).json({ error: 'Invite code is required' });
  }

  try {
    const groupResult = await pool.query(
      'SELECT id, name FROM groups WHERE invite_code = $1',
      [inviteCode.trim()]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const group = groupResult.rows[0];

    // Check if already a member
    const existingMember = await pool.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'You are already a member of this group' });
    }

    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, userId]
    );

    res.status(200).json({
      group: { id: group.id, name: group.name },
      message: 'Joined group successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while joining group' });
  }
};

// List all groups the current user belongs to
export const getMyGroups = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.invite_code, g.created_at,
              (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) AS member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    const groups = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      inviteCode: row.invite_code,
      createdAt: row.created_at,
      memberCount: parseInt(row.member_count, 10),
    }));

    res.status(200).json({ groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching groups' });
  }
};