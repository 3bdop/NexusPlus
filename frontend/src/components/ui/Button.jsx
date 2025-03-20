import React from 'react';
import styled from 'styled-components';

const Button = ({ val, type }) => {
  return (
    <StyledWrapper>
      <button id="btn" type={type}>{val}</button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    padding: 10px 20px;
    text-transform: uppercase;
    border-radius: 8px;
    font-size: 17px;
    font-weight: 500;
    color: #ffffff80;
    text-shadow: none;
    background: transparent;
    cursor: pointer;
    box-shadow: transparent;
    border: 1px solid #ffffff80;
    transition: 0.5s ease;
    user-select: none;
  }

  #btn:hover,
  :focus {
    color: #ffffff;
    background: #8C00FFFF;
    border: 1px solid #8C00FFFF;
    text-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff, 0 0 20px #ffffff;
    box-shadow: 0 0 5px #8C00FFFF, 0 0 20px #8C00FFFF, 0 0 50px #8C00FFFF,
      0 0 100px #8C00FFFF;
  }`;

export default Button;
