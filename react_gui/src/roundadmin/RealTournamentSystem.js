import React, { useState, useEffect } from 'react';
import { getAllRounds, getActiveTournament, createRound, updateRoundStatus, getRoundTeams, updateTeamParticipation, getRoundCriteria, updateRoundCriteria, getRoundAllocations, autoAllocateJudges, getRoundSummary, deleteRound, validateAllocation, getTournamentBracket, saveTournamentBracket, getMyTournamentAssignments, startTournament, stopTournament, getTournamentStatus } from '../services/round_services';
import { fetchAllTeams } from '../services/span_services';
import { getAllKriteria } from '../services/kriteria_services';
import authService from '../services/auth_service';

const RealTournamentSystem = () => {
  const [rounds, setRounds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [kriteria, setKriteria] = useState([]);
  const [beoordelaars, setBeoordelaars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('tournament');
  const [tournamentStatus, setTournamentStatus] = useState('inactive');
  const [tournamentData, setTournamentData] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [tournamentBracket, setTournamentBracket] = useState([]);
  const [matchCriteria, setMatchCriteria] = useState({});
  const [matchJudges, setMatchJudges] = useState({});
  const [phaseCriteria, setPhaseCriteria] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  // const [showPhaseCriteria, setShowPhaseCriteria] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  // const [selectedPhase, setSelectedPhase] = useState(null);
  const [roundToDelete, setRoundToDelete] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);

  // New round form state
  const [newRound, setNewRound] = useState({
    round_name: '',
    max_teams: 15,
    max_judges_per_team: 3,
    max_teams_per_judge: 3
  });

  useEffect(() => {
    loadData();
    // Load user data for authentication
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Load persistent tournament data
    loadPersistentData();
    
    // Debug: Log localStorage contents
    console.log('localStorage tournamentData:', localStorage.getItem('tournamentData'));
    console.log('localStorage roundStatuses:', localStorage.getItem('roundStatuses'));
  }, []);

  // Load persistent data from localStorage
  const loadPersistentData = () => {
    try {
      const storedTournamentData = localStorage.getItem('tournamentData');
      if (storedTournamentData) {
        const data = JSON.parse(storedTournamentData);
        console.log('Loading persistent data:', data);
        
        if (data.status) {
          setTournamentStatus(data.status);
        }
        if (data.selectedRound) {
          setSelectedRound(data.selectedRound);
        }
        if (data.tournamentData) {
          setTournamentData(data.tournamentData);
        }
        if (data.bracket) {
          setTournamentBracket(data.bracket);
        }
        if (data.matchCriteria) {
          setMatchCriteria(data.matchCriteria);
        }
        if (data.matchJudges) {
          setMatchJudges(data.matchJudges);
        }
        if (data.phaseCriteria) {
          setPhaseCriteria(data.phaseCriteria);
        }
        if (data.selectedTeams) {
          setSelectedTeams(data.selectedTeams);
        }
      }
    } catch (error) {
      console.error('Error loading persistent data:', error);
    }
  };

  // Save persistent data to localStorage
  const savePersistentData = (data) => {
    try {
      setSaveStatus('saving');
      const persistentData = {
        status: tournamentStatus,
        selectedRound: selectedRound,
        tournamentData: tournamentData,
        selectedTeams: selectedTeams,
        bracket: tournamentBracket,
        matchCriteria: matchCriteria,
        matchJudges: matchJudges,
        phaseCriteria: phaseCriteria,
        ...data,
        timestamp: new Date().toISOString()
      };
      console.log('Saving persistent data:', persistentData);
      localStorage.setItem('tournamentData', JSON.stringify(persistentData));
      setSaveStatus('saved');
      setLastSaved(new Date().toISOString());
    } catch (error) {
      console.error('Error saving persistent data:', error);
      setSaveStatus('error');
    }
  };

  // Auto-save function
  const autoSave = () => {
    const data = {
      status: tournamentStatus,
      selectedRound: selectedRound,
      tournamentData: tournamentData,
      selectedTeams: selectedTeams,
      bracket: tournamentBracket,
      matchCriteria: matchCriteria,
      matchJudges: matchJudges,
      phaseCriteria: phaseCriteria
    };
    savePersistentData(data);
  };

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (tournamentStatus === 'active' || selectedTeams.length > 0) {
        autoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [tournamentStatus, selectedTeams, tournamentBracket, matchCriteria, matchJudges, phaseCriteria]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data...');
      const [roundsData, teamsData, kriteriaData, beoordelaarsData] = await Promise.all([
        getAllRounds(),
        fetchAllTeams(),
        getAllKriteria(),
        loadBeoordelaars()
      ]);
      console.log('Data loaded:', { roundsData, teamsData, kriteriaData, beoordelaarsData });
      setRounds(roundsData || []);
      setTeams(teamsData || []);
      setKriteria(kriteriaData || []);
      setBeoordelaars(beoordelaarsData || []);
      
      // Check for active tournament
      try {
        const activeTournament = await getActiveTournament();
        if (activeTournament) {
          setTournamentStatus('active');
          setTournamentData(activeTournament);
          setMessage(`Aktiewe toernooi: ${activeTournament.tournament_name || activeTournament.round_name}`);
        } else {
          setTournamentStatus('inactive');
          setTournamentData(null);
          setMessage('Geen aktiewe toernooi nie');
        }
      } catch (error) {
        console.log('No active tournament found:', error.message);
        setTournamentStatus('inactive');
        setTournamentData(null);
        setMessage('Geen aktiewe toernooi nie');
      }
      
      // Load tournament bracket if a round is selected
      if (selectedRound) {
        try {
          const bracketData = await getTournamentBracket(selectedRound.round_id);
          if (bracketData && Object.keys(bracketData).length > 0) {
            setTournamentBracket(bracketData);
            setMessage('Toernooi bracket gelaai van database');
          }
        } catch (err) {
          console.log('No tournament bracket found for this round');
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setMessage('Fout met laai van data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBeoordelaars = async () => {
    try {
      const response = await authService.authenticatedFetch('http://localhost:4000/auth/beoordelaars');
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Kon nie beoordelaars laai nie');
      }
    } catch (err) {
      console.error('Error loading beoordelaars:', err);
      return [];
    }
  };

  const saveTournamentToDatabase = async (bracket) => {
    try {
      await saveTournamentBracket(selectedRound.round_id, bracket);
      setMessage('Toernooi bracket suksesvol gestoor in database');
    } catch (err) {
      console.error('Error saving tournament bracket:', err);
      setMessage('Fout met stoor van toernooi bracket: ' + err.message);
    }
  };

  const createTournamentBracket = (participatingTeams) => {
    const teamCount = participatingTeams.length;
    let rounds = [];
    
    // Helper function to create matches ensuring no team appears twice
    const createMatches = (teams, roundName, startId) => {
      const matches = [];
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffled.length; i += 2) {
        const matchId = startId + (i / 2);
        matches.push({
          id: matchId,
          team1: shuffled[i],
          team2: shuffled[i + 1] || null,
          winner: null,
          status: 'pending'
        });
      }
      
      return {
        name: roundName,
        matches: matches
      };
    };
    
    if (teamCount <= 2) {
      rounds = [createMatches(participatingTeams, 'Finale', 1)];
    } else if (teamCount <= 4) {
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      rounds = [
        createMatches(shuffled, 'Halfeindstryd', 1),
        {
          name: 'Finale',
          matches: [
            { id: 3, team1: null, team2: null, winner: null, status: 'pending' }
          ]
        }
      ];
    } else if (teamCount <= 8) {
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      rounds = [
        createMatches(shuffled, 'Kwarteindstryd', 1),
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 5, team1: null, team2: null, winner: null, status: 'pending' },
            { id: 6, team1: null, team2: null, winner: null, status: 'pending' }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 7, team1: null, team2: null, winner: null, status: 'pending' }
          ]
        }
      ];
    } else {
      // Large tournament with group stage
      const shuffled = [...participatingTeams].sort(() => Math.random() - 0.5);
      const groupCount = Math.ceil(teamCount / 8);
      const teamsPerGroup = Math.ceil(teamCount / groupCount);
      const groups = [];
      
      for (let i = 0; i < shuffled.length; i += teamsPerGroup) {
        groups.push(shuffled.slice(i, i + teamsPerGroup));
      }
      
      const groupMatches = [];
      groups.forEach((group, groupIndex) => {
        // Create round-robin matches within each group
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            groupMatches.push({
              id: groupIndex * 1000 + i * 10 + j,
              team1: group[i],
              team2: group[j],
              winner: null,
              status: 'pending',
              group: groupIndex + 1
            });
          }
        }
      });
      
      rounds = [
        {
          name: `Groepfase (${groupCount} groepe)`,
          matches: groupMatches
        },
        {
          name: 'Laaste 16',
          matches: Array.from({ length: 8 }, (_, i) => ({
            id: i + 2000,
            team1: null,
            team2: null,
            winner: null,
            status: 'pending'
          }))
        },
        {
          name: 'Kwarteindstryd',
          matches: [
            { id: 2008, team1: null, team2: null, winner: null, status: 'pending' },
            { id: 2009, team1: null, team2: null, winner: null, status: 'pending' },
            { id: 2010, team1: null, team2: null, winner: null, status: 'pending' },
            { id: 2011, team1: null, team2: null, winner: null, status: 'pending' }
          ]
        },
        {
          name: 'Halfeindstryd',
          matches: [
            { id: 2012, team1: null, team2: null, winner: null, status: 'pending' },
            { id: 2013, team1: null, team2: null, winner: null, status: 'pending' }
          ]
        },
        {
          name: 'Finale',
          matches: [
            { id: 2014, team1: null, team2: null, winner: null, status: 'pending' }
          ]
        }
      ];
    }
    
    // Validate that no team appears in multiple matches
    validateTournamentBracket(rounds);
    setTournamentBracket(rounds);
    
    // Save to database
    saveTournamentToDatabase(rounds);
  };

  const validateTournamentBracket = (rounds) => {
    rounds.forEach((round, roundIndex) => {
      const teamIds = new Set();
      const duplicateTeams = [];
      
      round.matches.forEach((match, matchIndex) => {
        if (match.team1) {
          if (teamIds.has(match.team1.span_id)) {
            duplicateTeams.push({
              team: match.team1.naam,
              teamId: match.team1.span_id,
              round: round.name,
              match: matchIndex + 1
            });
          } else {
            teamIds.add(match.team1.span_id);
          }
        }
        
        if (match.team2) {
          if (teamIds.has(match.team2.span_id)) {
            duplicateTeams.push({
              team: match.team2.naam,
              teamId: match.team2.span_id,
              round: round.name,
              match: matchIndex + 1
            });
          } else {
            teamIds.add(match.team2.span_id);
          }
        }
      });
      
      if (duplicateTeams.length > 0) {
        console.warn(`Duplicate teams found in ${round.name}:`, duplicateTeams);
        setMessage(`Warning: Some teams appear in multiple matches in ${round.name}`);
      }
    });
  };

  const getRequiredJudges = (roundIndex) => {
    // Progressive judge allocation: more judges for later rounds
    const baseJudges = 2;
    const progressiveJudges = Math.min(roundIndex + 1, 5);
    return Math.max(baseJudges, progressiveJudges);
  };

  // const getMatchCriteria = (roundIndex, matchIndex) => {
  //   const round = tournamentBracket[roundIndex];
  //   if (!round) return [];
  //   
  //   const baseCriteria = kriteria.filter(k => k.is_active !== 0);
  //   
  //   if (round.name.includes('Groepfase')) {
  //     return baseCriteria.slice(0, 3); // First 3 criteria for group stage
  //   } else if (round.name.includes('Laaste 16')) {
  //     return baseCriteria.slice(0, 4); // First 4 criteria for round of 16
  //   } else if (round.name.includes('Kwarteindstryd')) {
  //     return baseCriteria.slice(0, 5); // First 5 criteria for quarter-finals
  //   } else if (round.name.includes('Halfeindstryd')) {
  //     return baseCriteria.slice(0, 6); // First 6 criteria for semi-finals
  //   } else if (round.name.includes('Finale')) {
  //     return baseCriteria; // All criteria for final
  //   }
  //   
  //   return baseCriteria;
  // };

  const handleMatchCriteriaChange = (matchId, criteriaId, isSelected) => {
    setMatchCriteria(prev => {
      const newCriteria = { ...prev };
      if (!newCriteria[matchId]) {
        newCriteria[matchId] = [];
      }
      
      if (isSelected) {
        if (!newCriteria[matchId].includes(criteriaId)) {
          newCriteria[matchId].push(criteriaId);
        }
      } else {
        newCriteria[matchId] = newCriteria[matchId].filter(id => id !== criteriaId);
      }
      
      return newCriteria;
    });
  };

  const handleMatchJudgeChange = (matchId, judgeId, isSelected) => {
    setMatchJudges(prev => {
      const newJudges = { ...prev };
      if (!newJudges[matchId]) {
        newJudges[matchId] = [];
      }
      
      if (isSelected) {
        if (!newJudges[matchId].includes(judgeId)) {
          newJudges[matchId].push(judgeId);
        }
      } else {
        newJudges[matchId] = newJudges[matchId].filter(id => id !== judgeId);
      }
      
      return newJudges;
    });
  };

  // Phase-based criteria management
  const handlePhaseCriteriaChange = (phaseName, criteriaId, isSelected) => {
    setPhaseCriteria(prev => {
      const newPhaseCriteria = { ...prev };
      if (!newPhaseCriteria[phaseName]) {
        newPhaseCriteria[phaseName] = [];
      }
      
      if (isSelected) {
        if (!newPhaseCriteria[phaseName].includes(criteriaId)) {
          newPhaseCriteria[phaseName].push(criteriaId);
        }
      } else {
        newPhaseCriteria[phaseName] = newPhaseCriteria[phaseName].filter(id => id !== criteriaId);
      }
      
      return newPhaseCriteria;
    });
  };

  const applyPhaseCriteriaToMatches = (phaseName) => {
    const criteriaForPhase = phaseCriteria[phaseName] || [];
    const newMatchCriteria = { ...matchCriteria };
    
    // Find all matches in this phase and apply the criteria
    tournamentBracket.forEach((round, roundIndex) => {
      if (round.name === phaseName) {
        round.matches.forEach(match => {
          newMatchCriteria[match.id] = [...criteriaForPhase];
        });
      }
    });
    
    setMatchCriteria(newMatchCriteria);
    setMessage(`Kriteria toegepas op alle wedstryde in ${phaseName}!`);
  };

  const getPhaseNames = () => {
    return tournamentBracket.map(round => round.name);
  };

  const getMatchesInPhase = (phaseName) => {
    const round = tournamentBracket.find(r => r.name === phaseName);
    return round ? round.matches : [];
  };

  const autoAllocateJudgesToMatches = () => {
    const newMatchJudges = {};
    
    tournamentBracket.forEach((round, roundIndex) => {
      const requiredJudges = getRequiredJudges(roundIndex);
      const availableJudges = [...beoordelaars];
      
      round.matches.forEach(match => {
        if (match.team1 && match.team2) {
          // Allocate judges to this match
          const matchJudges = [];
          for (let i = 0; i < Math.min(requiredJudges, availableJudges.length); i++) {
            const judge = availableJudges[i % availableJudges.length];
            matchJudges.push(judge.user_id);
          }
          newMatchJudges[match.id] = matchJudges;
        }
      });
    });
    
    setMatchJudges(newMatchJudges);
    setMessage('Beoordelaars outomaties toegewys aan wedstryde!');
  };

  const handleMatchDetails = (match) => {
    setSelectedMatch(match);
    setShowMatchDetails(true);
  };

  const handleCreateRound = async () => {
    try {
      setLoading(true);
      await createRound(newRound);
      setMessage('Rondte suksesvol geskep!');
      setShowCreateForm(false);
      setNewRound({ round_name: '', max_teams: 15, max_judges_per_team: 3, max_teams_per_judge: 3 });
      loadData();
    } catch (err) {
      setMessage('Fout met skep van rondte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTournament = async (roundId, tournamentData) => {
    try {
      setLoading(true);
      
      // Validate that teams are selected
      if (!selectedTeams || selectedTeams.length === 0) {
        setMessage('Fout: Geen spanne gekies nie. Kies eers spanne voordat jy die toernooi begin.');
        setLoading(false);
        return;
      }
      
      // Validate minimum teams
      if (selectedTeams.length < 2) {
        setMessage('Fout: Jy moet ten minste 2 spanne kies om \'n toernooi te begin.');
        setLoading(false);
        return;
      }
      
      await startTournament(roundId, tournamentData);
      
      // Save persistent data
      const persistentData = {
        status: 'active',
        selectedRound: roundId,
        tournamentData: tournamentData,
        selectedTeams: selectedTeams,
        bracket: tournamentBracket,
        matchCriteria: matchCriteria,
        matchJudges: matchJudges,
        phaseCriteria: phaseCriteria
      };
      savePersistentData(persistentData);
      
      setMessage('Toernooi suksesvol begin');
      await loadData();
    } catch (error) {
      setMessage(`Fout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTournament = async (roundId) => {
    try {
      setLoading(true);
      await stopTournament(roundId);
      
      // Update persistent data
      const persistentData = {
        status: 'inactive',
        selectedRound: null,
        tournamentData: null,
        selectedTeams: selectedTeams, // Keep teams for future tournaments
        bracket: tournamentBracket,
        matchCriteria: matchCriteria,
        matchJudges: matchJudges,
        phaseCriteria: phaseCriteria
      };
      savePersistentData(persistentData);
      
      setMessage('Toernooi suksesvol gestop');
      await loadData();
    } catch (error) {
      setMessage(`Fout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Close a round
  const handleCloseRound = async (roundId) => {
    try {
      setLoading(true);
      await updateRoundStatus(roundId, 'closed');
      setMessage(`Round ${roundId} closed successfully`);
      await loadData();
    } catch (error) {
      setMessage(`Error closing round: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Open a round
  const handleOpenRound = async (roundId) => {
    try {
      setLoading(true);
      await updateRoundStatus(roundId, 'open');
      setMessage(`Round ${roundId} opened successfully`);
      await loadData();
    } catch (error) {
      setMessage(`Error opening round: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRound = (round) => {
    setRoundToDelete(round);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRound = async () => {
    try {
      setLoading(true);
      console.log('Attempting to delete round:', roundToDelete);
      console.log('User token:', localStorage.getItem('token'));
      console.log('User data:', localStorage.getItem('user'));
      
      await deleteRound(roundToDelete.round_id);
      setMessage(`Rondte "${roundToDelete.round_name}" suksesvol geskrap!`);
      setShowDeleteConfirm(false);
      setRoundToDelete(null);
      
      // If the deleted round was selected, clear selection
      if (selectedRound && selectedRound.round_id === roundToDelete.round_id) {
        setSelectedRound(null);
        setTournamentBracket([]);
      }
      
      loadData();
    } catch (err) {
      console.error('Delete round error:', err);
      setMessage('Fout met skrap van rondte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteRound = () => {
    setShowDeleteConfirm(false);
    setRoundToDelete(null);
  };

  // const handleSelectRound = async (round) => {
  //   setSelectedRound(round);
  //   // Automatically allocate teams to this round and create tournament bracket
  //   await autoAllocateTeamsToRound(round);
  // };

  const autoAllocateTeamsToRound = async (round) => {
    try {
      setLoading(true);
      setMessage('Allocating teams to tournament...');
      
      // Get all available teams
      const allTeams = teams.slice(0, round.max_teams); // Limit to max teams for this round
      
      // Automatically set all teams as participating
      const teamAllocations = allTeams.map(team => ({
        round_id: round.round_id,
        span_id: team.span_id,
        is_participating: 1
      }));
      
      // Update team participation in database
      for (const allocation of teamAllocations) {
        try {
          await updateTeamParticipation(allocation.round_id, allocation.span_id, allocation.is_participating);
        } catch (err) {
          console.log(`Team ${allocation.span_id} might already be allocated:`, err.message);
        }
      }
      
      // Create tournament bracket with allocated teams
      createTournamentBracket(allTeams);
      setMessage(`Successfully allocated ${allTeams.length} teams to tournament!`);
      
    } catch (err) {
      setMessage('Error allocating teams: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelection = () => {
    setShowTeamSelection(true);
    // Don't reset selectedTeams - keep existing selection
  };

  const handleTeamToggle = (team) => {
    setSelectedTeams(prev => {
      const isSelected = prev.some(t => t.span_id === team.span_id);
      let newTeams;
      if (isSelected) {
        newTeams = prev.filter(t => t.span_id !== team.span_id);
      } else {
        newTeams = [...prev, team];
      }
      
      // Save to persistent storage immediately
      savePersistentData({ selectedTeams: newTeams });
      
      return newTeams;
    });
  };

  const handleCreateTournamentWithSelectedTeams = async () => {
    if (selectedTeams.length < 2) {
      setMessage('Jy moet ten minste 2 spanne kies vir die toernooi');
      return;
    }

    try {
      setLoading(true);
      setMessage('Skep toernooi met geselekteerde spanne...');
      
      // Update team participation in database
      for (const team of selectedTeams) {
        try {
          await updateTeamParticipation(selectedRound.round_id, team.span_id, 1);
        } catch (err) {
          console.log(`Team ${team.span_id} might already be allocated:`, err.message);
        }
      }
      
      // Create tournament bracket with selected teams
      createTournamentBracket(selectedTeams);
      setMessage(`Toernooi suksesvol geskep met ${selectedTeams.length} spanne!`);
      setShowTeamSelection(false);
      
    } catch (err) {
      console.error('Error creating tournament:', err);
      setMessage('Fout met skep van toernooi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // const loadRoundTeams = async (round) => {
  //   try {
  //     const teamsData = await getRoundTeams(round.round_id);
  //     const participatingTeams = teamsData.filter(team => team.is_participating === 1);
  //     createTournamentBracket(participatingTeams);
  //   } catch (err) {
  //     setMessage('Fout met laai van spanne: ' + err.message);
  //   }
  // };

  const getMatchStyle = (match) => {
    if (match.status === 'completed') {
      return {
        border: '2px solid #28a745',
        backgroundColor: '#d4edda'
      };
    } else if (match.status === 'in_progress') {
      return {
        border: '2px solid #ffc107',
        backgroundColor: '#fff3cd'
      };
    }
    return {
      border: '1px solid #ddd',
      backgroundColor: '#f8f9fa'
    };
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#0e1e3b', 
          marginBottom: '10px',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>🏆 Real Tournament System</h1>
        
        {/* Tournament Status Indicator */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {tournamentStatus === 'active' && (
            <div style={{
              display: 'inline-block',
              padding: '15px 25px',
              backgroundColor: '#d4edda',
              border: '2px solid #28a745',
              borderRadius: '25px',
              color: '#155724',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              🟢 Toernooi Aktief
              <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '5px' }}>
                {tournamentData?.tournament_name || tournamentData?.round_name}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '5px', color: '#666' }}>
                Fase: {tournamentData?.current_phase} | 
                <button 
                  onClick={() => handleStopTournament(tournamentData?.round_id)}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Stop Toernooi
                </button>
              </div>
            </div>
          )}
          {tournamentStatus === 'inactive' && (
            <div style={{
              display: 'inline-block',
              padding: '15px 25px',
              backgroundColor: '#f8d7da',
              border: '2px solid #dc3545',
              borderRadius: '25px',
              color: '#721c24',
              fontWeight: 'bold',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              🔴 Geen Aktiewe Toernooi
              <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '5px' }}>
                Kies 'n rondte en begin 'n toernooi
              </div>
            </div>
          )}
        </div>
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '1.1rem',
          marginBottom: '0'
        }}>Professional Tournament Management with Phase-Based Criteria</p>
      </div>
      
      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Fout') ? '#f8d7da' : '#d4edda',
          color: message.includes('Fout') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Fout') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('rounds')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'rounds' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'rounds' ? 'white' : '#495057',
              border: activeTab === 'rounds' ? 'none' : '2px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'rounds' ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none'
            }}
          >
            📋 Rounds
          </button>
          <button
            onClick={() => setActiveTab('tournament')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'tournament' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'tournament' ? 'white' : '#495057',
              border: activeTab === 'tournament' ? 'none' : '2px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'tournament' ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none'
            }}
          >
            🏆 Tournament
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'phases' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'phases' ? 'white' : '#495057',
              border: activeTab === 'phases' ? 'none' : '2px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'phases' ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none'
            }}
          >
            🎯 Phase Criteria
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'judges' ? '#007bff' : '#f8f9fa',
              color: activeTab === 'judges' ? 'white' : '#495057',
              border: activeTab === 'judges' ? 'none' : '2px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'judges' ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none'
            }}
          >
            👥 Judge Management
          </button>
        </div>
      </div>

      {/* Rounds Tab */}
      {activeTab === 'rounds' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #e9ecef'
          }}>
            <div>
              <h2 style={{ 
                color: '#0e1e3b', 
                margin: '0 0 5px 0',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}>Round Management</h2>
              <p style={{ color: '#666', margin: '0', fontSize: '1.1rem' }}>
                Create and manage tournament rounds
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              + Create New Round
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Laai data...
            </div>
          )}

          {!loading && rounds.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>Geen rondtes beskikbaar nie</h3>
              <p>Klik "Skep Nuwe Rondte" om 'n toernooi te begin</p>
            </div>
          )}

          {/* User Status Message */}
          {!user && (
            <div style={{ 
              marginBottom: '20px',
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#856404',
              textAlign: 'center'
            }}>
              ⚠️ Jy moet ingeteken wees as admin om rondtes te skrap
            </div>
          )}
          {user && user.role !== 'admin' && (
            <div style={{ 
              marginBottom: '20px',
              padding: '15px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#721c24',
              textAlign: 'center'
            }}>
              ⚠️ Slegs admins kan rondtes skrap
            </div>
          )}

          <div style={{ display: 'grid', gap: '20px' }}>
            {rounds.map(round => (
              <div key={round.round_id} style={{
                padding: '25px',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                ':hover': {
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      color: '#0e1e3b',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}>{round.round_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#666', fontSize: '14px' }}>Status:</span>
                      <span style={{ 
                        color: round.status === 'open' ? '#28a745' : round.status === 'closed' ? '#dc3545' : '#6c757d',
                        fontWeight: 'bold',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: round.status === 'open' ? '#d4edda' : round.status === 'closed' ? '#f8d7da' : '#e9ecef',
                        fontSize: '12px'
                      }}>
                        {round.status === 'open' ? '🟢 Open' : round.status === 'closed' ? '🔴 Closed' : '📁 Archived'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                            const tournamentName = prompt('Voer toernooi naam in:', `${round.round_name} Tournament`);
                            if (tournamentName) {
                              handleStartTournament(round.round_id, {
                                tournament_name: tournamentName,
                                current_phase: 'Round 1',
                                total_phases: 1
                              });
                            }
                          }}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0, 123, 255, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🏆 Start Tournament
                        </button>
                        
                        {/* Close Round Button */}
                        {round.status === 'open' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Is jy seker jy wil ${round.round_name} toemaak?`)) {
                                handleCloseRound(round.round_id);
                              }
                            }}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔒 Close Round
                          </button>
                        )}
                        
                        {/* Open Round Button */}
                        {round.status === 'closed' && (
                          <button
                            onClick={() => {
                              handleOpenRound(round.round_id);
                            }}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔓 Open Round
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedRound(round);
                            setActiveTab('tournament');
                            handleTeamSelection();
                          }}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🎯 Choose Teams
                        </button>
                      </div>
                      {user && user.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteRound(round)}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      textAlign: 'center'
                    }}>
                      Teams will be auto-allocated
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '20px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                      {round.max_teams}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Max Teams
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
                      {round.max_judges_per_team}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Judges per Team
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545', marginBottom: '5px' }}>
                      {round.max_teams_per_judge}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Teams per Judge
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament Tab */}
      {activeTab === 'tournament' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          {!selectedRound ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#495057' }}>
                No Round Selected
              </h3>
              <p style={{ fontSize: '1.1rem', margin: '0' }}>
                Go to the "Rounds" tab and click "Start Tournament" on a round
              </p>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '30px',
                paddingBottom: '20px',
                borderBottom: '2px solid #e9ecef'
              }}>
                <div>
                  <h2 style={{ 
                    color: '#0e1e3b', 
                    margin: '0 0 5px 0',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    🏆 Tournament: {selectedRound.round_name}
                  </h2>
                  <p style={{ color: '#666', margin: '0', fontSize: '1.1rem' }}>
                    Manage tournament matches and judge allocation
                  </p>
                  
                  {/* Save Status Indicator */}
                  <div style={{ 
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    {saveStatus === 'saving' && (
                      <span style={{ color: '#ff9800', fontSize: '14px' }}>
                        💾 Saving...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span style={{ color: '#4caf50', fontSize: '14px' }}>
                        ✅ All changes saved
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span style={{ color: '#f44336', fontSize: '14px' }}>
                        ❌ Save error
                      </span>
                    )}
                    {lastSaved && (
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        Last saved: {new Date(lastSaved).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    marginTop: '10px',
                    padding: '10px 15px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1976d2'
                  }}>
                    📊 {tournamentBracket.length > 0 ? 
                      `${tournamentBracket.reduce((total, round) => total + round.matches.length, 0)} matches across ${tournamentBracket.length} rounds` : 
                      'No tournament bracket generated yet'
                    }
                    {tournamentBracket.length > 0 && (
                      <div style={{ marginTop: '5px', fontSize: '12px', color: '#28a745' }}>
                        ✅ Teams properly scheduled (no conflicts)
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={autoAllocateJudgesToMatches}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    🎯 Auto Allocate Judges
                  </button>
                </div>
              </div>

              {/* Teams Overview */}
              {tournamentBracket.length > 0 && (
                <div style={{
                  marginBottom: '30px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#0e1e3b',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    👥 Allocated Teams ({teams.slice(0, selectedRound.max_teams).length})
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '10px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {teams.slice(0, selectedRound.max_teams).map(team => (
                      <div key={team.span_id} style={{
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#495057'
                      }}>
                        {team.naam}
                      </div>
                    ))}
                  </div>
                </div>
              )}

          <div style={{ display: 'flex', gap: '30px', overflowX: 'auto' }}>
            {tournamentBracket.map((round, roundIndex) => (
              <div key={roundIndex} style={{ minWidth: '350px' }}>
                <h3 style={{ 
                  textAlign: 'center', 
                  marginBottom: '20px', 
                  color: '#0e1e3b',
                  padding: '10px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px'
                }}>
                  {round.name}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {getRequiredJudges(roundIndex)} beoordelaar(s) • {phaseCriteria[round.name]?.length || 0} fase kriteria
                  </div>
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {round.matches.map((match, matchIndex) => (
                    <div key={match.id} style={{
                      padding: '15px',
                      borderRadius: '8px',
                      ...getMatchStyle(match)
                    }}>
                      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                        {match.group ? `Groep ${match.group}` : `Wedstryd ${matchIndex + 1}`}
                      </div>
                      
                      {/* Match Teams */}
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '5px',
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>
                            {match.team1 ? match.team1.naam : 'TBD'}
                            {!match.team2 && match.team1 && (
                              <span style={{ color: '#28a745', marginLeft: '5px', fontSize: '10px' }}>
                                ⚡ Auto-advance
                              </span>
                            )}
                          </span>
                        </div>
                        
                        <div style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px', color: '#666' }}>
                          VS
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px'
                        }}>
                          <span style={{ fontWeight: 'bold' }}>
                            {match.team2 ? match.team2.naam : 'TBD'}
                            {!match.team1 && match.team2 && (
                              <span style={{ color: '#28a745', marginLeft: '5px', fontSize: '10px' }}>
                                ⚡ Auto-advance
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* Match Actions */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        <button
                          onClick={() => handleMatchDetails(match)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Beheer
                        </button>
                        <button
                          onClick={() => {
                            const newBracket = [...tournamentBracket];
                            const matchToUpdate = newBracket[roundIndex].matches[matchIndex];
                            matchToUpdate.status = matchToUpdate.status === 'completed' ? 'pending' : 'completed';
                            setTournamentBracket(newBracket);
                          }}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: match.status === 'completed' ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {match.status === 'completed' ? 'Heropen' : 'Voltooi'}
                        </button>
                      </div>
                      
                      {/* Match Info */}
                      <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                        <div><strong>Fase Kriteria:</strong> {phaseCriteria[round.name]?.length || 0} geselekteer</div>
                        <div><strong>Wedstryd Kriteria:</strong> {matchCriteria[match.id]?.length || 0} geselekteer</div>
                        <div><strong>Beoordelaars:</strong> {matchJudges[match.id]?.length || 0} toegewys</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>
      )}

      {/* Phase Criteria Tab */}
      {activeTab === 'phases' && (
        <div>
          {!selectedRound ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>Geen rondte geselekteer nie</h3>
              <p>Gaan na die "Rounds" tab en klik "Start Tournament" op 'n rondte</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#0e1e3b', margin: '0' }}>Phase Criteria Management</h2>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Wysig kriteria vir elke toernooi fase
                </div>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                {getPhaseNames().map(phaseName => (
                  <div key={phaseName} style={{
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: '0', color: '#0e1e3b' }}>{phaseName}</h3>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {getMatchesInPhase(phaseName).length} wedstryde
                        </span>
                        <button
                          onClick={() => applyPhaseCriteriaToMatches(phaseName)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Pas Toe op Alle Wedstryde
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {kriteria.map(criteria => (
                        <label key={criteria.kriteria_id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}>
                          <input
                            type="checkbox"
                            checked={phaseCriteria[phaseName]?.includes(criteria.kriteria_id) || false}
                            onChange={(e) => handlePhaseCriteriaChange(phaseName, criteria.kriteria_id, e.target.checked)}
                          />
                          <span style={{ fontSize: '14px' }}>{criteria.beskrywing}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                      <strong>Geselekteerde kriteria:</strong> {phaseCriteria[phaseName]?.length || 0} van {kriteria.length}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Judge Management Tab */}
      {activeTab === 'judges' && (
        <div>
          <h2 style={{ color: '#0e1e3b', marginBottom: '20px' }}>Judge Management</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Judges List */}
            <div>
              <h3 style={{ color: '#0e1e3b', marginBottom: '15px' }}>Available Judges</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {beoordelaars.map(judge => (
                  <div key={judge.user_id} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{judge.email}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Role: {judge.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criteria List */}
            <div>
              <h3 style={{ color: '#0e1e3b', marginBottom: '15px' }}>Available Criteria</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {kriteria.map(criteria => (
                  <div key={criteria.kriteria_id} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{criteria.beskrywing}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Max Score: {criteria.default_totaal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Details Modal */}
      {showMatchDetails && selectedMatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0e1e3b' }}>
              Match Details: {selectedMatch.team1?.naam || 'TBD'} vs {selectedMatch.team2?.naam || 'TBD'}
            </h2>
            
            {/* Criteria Selection */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#0e1e3b', marginBottom: '10px' }}>Select Criteria</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {kriteria.map(criteria => (
                  <label key={criteria.kriteria_id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={matchCriteria[selectedMatch.id]?.includes(criteria.kriteria_id) || false}
                      onChange={(e) => handleMatchCriteriaChange(selectedMatch.id, criteria.kriteria_id, e.target.checked)}
                    />
                    <span>{criteria.beskrywing}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Judge Selection */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#0e1e3b', marginBottom: '10px' }}>Assign Judges</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {beoordelaars.map(judge => (
                  <label key={judge.user_id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={matchJudges[selectedMatch.id]?.includes(judge.user_id) || false}
                      onChange={(e) => handleMatchJudgeChange(selectedMatch.id, judge.user_id, e.target.checked)}
                    />
                    <span>{judge.email}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowMatchDetails(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Round Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0e1e3b' }}>Create New Round</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Round Name:</label>
              <input
                type="text"
                value={newRound.round_name}
                onChange={(e) => setNewRound({ ...newRound, round_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="e.g. Capstone 2024 - Final Round"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Max Teams:</label>
              <input
                type="number"
                value={newRound.max_teams}
                onChange={(e) => setNewRound({ ...newRound, max_teams: parseInt(e.target.value) || 15 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                min="1"
                max="100"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Judges per Team:</label>
              <input
                type="number"
                value={newRound.max_judges_per_team}
                onChange={(e) => setNewRound({ ...newRound, max_judges_per_team: parseInt(e.target.value) || 3 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                min="1"
                max="10"
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRound}
                disabled={loading || !newRound.round_name}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading || !newRound.round_name ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !newRound.round_name ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create Round'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && roundToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ 
              margin: '0 0 15px 0', 
              color: '#dc3545',
              fontSize: '24px'
            }}>
              Skrap Rondte?
            </h2>
            <p style={{ 
              margin: '0 0 25px 0', 
              fontSize: '16px', 
              color: '#666',
              lineHeight: '1.5'
            }}>
              Jy is besig om <strong>"{roundToDelete.round_name}"</strong> te skrap.
              <br />
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                Hierdie aksie kan nie ongedaan gemaak word nie!
              </span>
            </p>
            <div style={{ 
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '25px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong>⚠️ Let op:</strong> Alle toernooi data, wedstryde, en beoordelaar toewysings vir hierdie rondte sal permanent geskrap word.
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={cancelDeleteRound}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                Kanselleer
              </button>
              <button
                onClick={confirmDeleteRound}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 8px rgba(220, 53, 69, 0.3)'
                }}
              >
                {loading ? 'Skrap...' : '🗑️ Ja, Skrap Rondte'}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Team Selection Modal */}
        {showTeamSelection && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#0e1e3b', textAlign: 'center' }}>
                🎯 Kies Spanne vir Toernooi
              </h2>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#666', textAlign: 'center' }}>
                  Kies die spanne wat aan die toernooi sal deelneem. Jy moet ten minste 2 spanne kies.
                </p>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '10px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <strong>Geselekteerde Spanne: {selectedTeams.length}</strong>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '15px',
                marginBottom: '30px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {teams.map(team => {
                  const isSelected = selectedTeams.some(t => t.span_id === team.span_id);
                  return (
                    <div
                      key={team.span_id}
                      onClick={() => handleTeamToggle(team)}
                      style={{
                        padding: '15px',
                        border: `2px solid ${isSelected ? '#28a745' : '#ddd'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#d4edda' : '#f8f9fa',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#28a745' : '#ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#0e1e3b', marginBottom: '5px' }}>
                          {team.naam}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {team.projek_beskrywing}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button
                  onClick={() => setShowTeamSelection(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Kanselleer
                </button>
                <button
                  onClick={handleCreateTournamentWithSelectedTeams}
                  disabled={selectedTeams.length < 2 || loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: selectedTeams.length >= 2 && !loading ? '#28a745' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedTeams.length >= 2 && !loading ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    opacity: selectedTeams.length >= 2 && !loading ? 1 : 0.6
                  }}
                >
                  {loading ? 'Skep...' : `Skep Toernooi (${selectedTeams.length} spanne)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default RealTournamentSystem;
