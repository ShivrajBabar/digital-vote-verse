
import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../db';
import { verifyToken } from '../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verify token for all requests
  const user = await verifyToken(req, res);
  if (!user) {
    return;
  }

  switch (method) {
    case 'POST':
      if (req.url?.includes('/cast')) {
        return await castVote(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    case 'GET':
      if (req.url?.includes('/status')) {
        return await getVoterStatus(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Cast vote
async function castVote(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only voters can cast votes
    if (user.role !== 'voter') {
      return res.status(403).json({ message: 'Only voters can cast votes' });
    }
    
    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account must be active to vote' });
    }
    
    const { election_id, candidate_id, booth_id } = req.body;
    
    if (!election_id || !candidate_id || !booth_id) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const db = await openDB();
    
    // Check if election exists and is ongoing
    const election = await db.get(
      'SELECT * FROM elections WHERE id = ? AND status = ?',
      [election_id, 'Ongoing']
    );
    
    if (!election) {
      return res.status(400).json({ message: 'Election not found or not ongoing' });
    }
    
    // Check if voting is currently allowed based on start/end times
    const now = new Date();
    const votingStart = new Date(election.voting_start);
    const votingEnd = new Date(election.voting_end);
    
    if (now < votingStart || now > votingEnd) {
      return res.status(400).json({ message: 'Voting is not currently open for this election' });
    }
    
    // Check if candidate is valid and approved
    const candidate = await db.get(
      'SELECT * FROM candidates WHERE id = ? AND election_id = ? AND status = ?',
      [candidate_id, election_id, 'Approved']
    );
    
    if (!candidate) {
      return res.status(400).json({ message: 'Candidate not found or not approved for this election' });
    }
    
    // Check if booth exists and is active
    const booth = await db.get(
      'SELECT * FROM booths WHERE id = ? AND status = ?',
      [booth_id, 'Active']
    );
    
    if (!booth) {
      return res.status(400).json({ message: 'Booth not found or inactive' });
    }
    
    // Check if booth is in the same constituency as the candidate
    if (booth.constituency_id !== candidate.constituency_id) {
      return res.status(400).json({ message: 'Booth is not in the same constituency as the candidate' });
    }
    
    // Check if user has already voted in this election
    const existingVote = await db.get(
      'SELECT * FROM votes WHERE election_id = ? AND voter_id = ?',
      [election_id, user.id]
    );
    
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }
    
    // Cast vote
    await db.run(
      `INSERT INTO votes 
      (election_id, constituency_id, candidate_id, voter_id, booth_id, timestamp, is_valid, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))`,
      [election_id, candidate.constituency_id, candidate_id, user.id, booth_id, 1]
    );
    
    return res.status(200).json({ message: 'Vote cast successfully' });
  } catch (error) {
    console.error('Cast vote error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get voter status for an election
async function getVoterStatus(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only voters can check their voting status
    if (user.role !== 'voter') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const { election_id } = req.query;
    
    if (!election_id) {
      return res.status(400).json({ message: 'Election ID is required' });
    }
    
    const db = await openDB();
    
    // Check if election exists
    const election = await db.get('SELECT * FROM elections WHERE id = ?', [election_id]);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Check if user has voted
    const vote = await db.get(
      'SELECT * FROM votes WHERE election_id = ? AND voter_id = ?',
      [election_id, user.id]
    );
    
    return res.status(200).json({
      hasVoted: !!vote,
      voteTimestamp: vote ? vote.timestamp : null,
      election: {
        id: election.id,
        name: election.name,
        status: election.status,
        voting_start: election.voting_start,
        voting_end: election.voting_end
      }
    });
  } catch (error) {
    console.error('Get voter status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
